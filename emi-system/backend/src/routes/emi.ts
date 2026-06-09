import { Router } from 'express';
import multer from 'multer';
import { EmiApplication } from '../models/EmiApplication';
import { generateOtp, verifyOtp } from '../services/otpService';
import { sendAdminNotification, sendCustomerEmail } from '../services/emailService';
import { generateAgreementPdf } from '../utils/pdfGenerator';
import { scanBuffer as scanBufferService } from '../services/scanService';
import { pdfQueue } from '../jobs/queue';
// Ensure worker is started when routes are loaded (worker runs in same process if present)
import '../jobs/pdfWorker';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinaryV2 } from 'cloudinary';

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinaryV2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Simple file validator and virus-scan stub
function validateFile(file: any, allowed: string[], maxBytes: number) {
  if (!file) return { ok: false, error: 'No file' };
  if (file.size > maxBytes) return { ok: false, error: 'File too large' };
  if (!allowed.includes(file.mimetype)) return { ok: false, error: 'Invalid file type' };
  return { ok: true };
}

const s3Client = process.env.AWS_S3_BUCKET && process.env.AWS_REGION ? new S3Client({ region: process.env.AWS_REGION }) : null;

async function scanBuffer(buf: Buffer) {
  // Delegate to ClamAV scanning service which calls clamscan/clamd
  return await scanBufferService(buf);
}

async function enqueueAgreementGeneration(appId: string, appObj: any) {
  // If REDIS_URL is configured or pdfQueue is available, enqueue job
  try {
    if (process.env.REDIS_URL) {
      await pdfQueue.add({ appId });
      return { queued: true };
    }
  } catch (err) {
    console.warn('Failed to enqueue PDF job, falling back to sync generation', err);
  }

  // Fallback: synchronously generate and upload like worker
  const outDir = path.resolve('./emi-system/backend/tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `agreement-${appId}.pdf`);
  const dataForPdf = { ...appObj, signaturePath: appObj.signatureUrl };
  await generateAgreementPdf(dataForPdf, out);

  // Upload to Cloudinary if configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const result: any = await new Promise((resolve, reject) => {
        const stream = cloudinaryV2.uploader.upload_stream({ folder: 'xpc/agreements', resource_type: 'auto', public_id: `agreement-${appId}` }, (err, resu) => {
          if (err) reject(err);
          else resolve(resu);
        });
        const rs = fs.createReadStream(out);
        rs.pipe(stream);
      });
      return { url: result.secure_url || result.url };
    } catch (err) {
      console.error('Cloudinary upload failed for agreement (sync):', err);
    }
  }

  // Upload to S3 if configured
  if (s3Client && process.env.AWS_S3_BUCKET) {
    try {
      const bucket = process.env.AWS_S3_BUCKET as string;
      const key = `agreements/agreement-${appId}.pdf`;
      const body = fs.createReadStream(out);
      await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/pdf' }));
      const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      return { url: s3Url };
    } catch (err) {
      console.error('S3 upload failed for agreement (sync):', err);
    }
  }

  return { url: out };
}

const upload = multer({ storage: multer.memoryStorage() });

export const emiRouter = Router();

// Landing data, calculator, FAQ
emiRouter.get('/landing', (req, res) => {
  res.json({
    hero: { title: 'EMI Finance for Gaming PCs', subtitle: 'Premium plans starting from ₹2999/month' },
  });
});

// Start application
emiRouter.post('/apply', upload.fields([{ name: 'aadhaar' }, { name: 'pan' }]), async (req, res) => {
  try {
    const body = req.body;
    const app = await EmiApplication.create({
      customer: {
        fullName: body.fullName,
        mobile: body.mobile,
        email: body.email,
        dob: body.dob,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
      },
      aadhaarNumber: body.aadhaarNumber,
      panNumber: body.panNumber,
      emiPlan: JSON.parse(body.emiPlan || '{}'),
      status: 'pending',
      autoDebitConsent: body.autoDebitConsent === 'true',
    });

    // Save uploaded KYC documents (aadhaar, pan) to Cloudinary when configured, otherwise local storage
    const files = (req as any).files as Record<string, any[]> | undefined;
    if (files) {
      const docs: any = {};
      // handle Aadhaar
      if (files['aadhaar'] && files['aadhaar'][0]) {
        const f = files['aadhaar'][0];
        // validate file: allow images and pdf up to 5MB
        const check = validateFile(f, ['image/png', 'image/jpeg', 'application/pdf'], 5 * 1024 * 1024);
        if (!check.ok) {
          res.status(400).json({ error: `Aadhaar upload failed: ${check.error}` });
          return;
        }
        const clean = await scanBuffer(f.buffer);
        if (!clean) {
          res.status(400).json({ error: 'Aadhaar upload failed virus scan' });
          return;
        }
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
          try {
            const result: any = await new Promise((resolve, reject) => {
              const stream = cloudinaryV2.uploader.upload_stream({ folder: 'xpc/documents', resource_type: 'auto' }, (err, resu) => {
                if (err) reject(err);
                else resolve(resu);
              });
              stream.end(f.buffer);
            });
            docs.aadhaarUrl = result.secure_url || result.url;
          } catch (err) {
            console.error('Cloudinary upload failed for aadhaar:', err);
          }
        }
        if (!docs.aadhaarUrl) {
          const outDir = path.resolve('./emi-system/backend/uploads/docs');
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
          const outPath = path.join(outDir, `${app._id}-aadhaar${path.extname(f.originalname) || '.png'}`);
          fs.writeFileSync(outPath, f.buffer);
          docs.aadhaarUrl = outPath;
        }
      }
      // handle PAN
      if (files['pan'] && files['pan'][0]) {
        const f = files['pan'][0];
        const check = validateFile(f, ['image/png', 'image/jpeg', 'application/pdf'], 5 * 1024 * 1024);
        if (!check.ok) {
          res.status(400).json({ error: `PAN upload failed: ${check.error}` });
          return;
        }
        const clean = await scanBuffer(f.buffer);
        if (!clean) {
          res.status(400).json({ error: 'PAN upload failed virus scan' });
          return;
        }
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
          try {
            const result: any = await new Promise((resolve, reject) => {
              const stream = cloudinaryV2.uploader.upload_stream({ folder: 'xpc/documents', resource_type: 'auto' }, (err, resu) => {
                if (err) reject(err);
                else resolve(resu);
              });
              stream.end(f.buffer);
            });
            docs.panUrl = result.secure_url || result.url;
          } catch (err) {
            console.error('Cloudinary upload failed for pan:', err);
          }
        }
        if (!docs.panUrl) {
          const outDir = path.resolve('./emi-system/backend/uploads/docs');
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
          const outPath = path.join(outDir, `${app._id}-pan${path.extname(f.originalname) || '.png'}`);
          fs.writeFileSync(outPath, f.buffer);
          docs.panUrl = outPath;
        }
      }
      if (Object.keys(docs).length) {
        app.documents = { ...app.documents, ...docs } as any;
        await app.save();
      }
    }

    // Auto-generate agreement PDF (draft) when documents uploaded
    try {
      const result = await enqueueAgreementGeneration(app._id.toString(), app.toObject());
      if (result && (result as any).url) {
        app.agreementPdfUrl = (result as any).url;
        await app.save();
      } else if (result && (result as any).queued) {
        // queued, leave as-is
      }
    } catch (err) {
      console.error('Failed to generate/enqueue agreement after doc upload', err);
    }

    // generate OTP and send to mobile
    const otp = await generateOtp(body.mobile);
    // In prod, DO NOT return OTP. Here for testing only:

    await sendAdminNotification(app);
    await sendCustomerEmail(body.email, 'EMI Application Received', '<p>Your application is received.</p>');

    res.status(201).json({ id: app._id, otp });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

emiRouter.post('/verify-otp', async (req, res) => {
  const { target, otp, applicationId } = req.body;
  const ok = await verifyOtp(target, otp);
  if (!ok) {
    res.status(400).json({ error: 'Invalid or expired OTP' });
    return;
  }
  if (applicationId) {
    await EmiApplication.findByIdAndUpdate(applicationId, { otpVerified: true });
  }
  res.json({ ok: true });
});

// Admin endpoints (should be protected via middleware)
emiRouter.get('/admin/applications', async (req, res) => {
  const apps = await EmiApplication.find().sort({ createdAt: -1 }).limit(200);
  res.json({ applications: apps });
});

emiRouter.post('/admin/applications/:id/approve', async (req, res) => {
  const id = req.params.id;
  const app = await EmiApplication.findById(id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  app.status = 'approved';
  await app.save();
  // send email
  await sendCustomerEmail(app.customer?.email ?? '', 'EMI Approved', '<p>Your EMI is approved.</p>');
  res.json({ ok: true });
});

emiRouter.post('/admin/applications/:id/reject', async (req, res) => {
  const id = req.params.id;
  const reason = req.body.reason || 'Not specified';
  const app = await EmiApplication.findById(id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  app.status = 'rejected';
  app.adminNote = reason;
  await app.save();
  await sendCustomerEmail(app.customer?.email ?? '', 'EMI Rejected', `<p>Your EMI was rejected. Reason: ${reason}</p>`);
  res.json({ ok: true });
});

// Admin: update application fields (customer info, address, notes)
emiRouter.patch('/admin/applications/:id', async (req, res) => {
  const id = req.params.id;
  const app = await EmiApplication.findById(id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  const body = req.body || {};
  // Allow updating customer fields and adminNote
  if (body.customer) {
    app.customer = { ...(app.customer as any)?.toObject?.(), ...body.customer } as any;
  }
  if (typeof body.adminNote !== 'undefined') app.adminNote = body.adminNote;
  if (typeof body.kycVerified !== 'undefined') app.kycVerified = !!body.kycVerified;
  await app.save();
  res.json({ ok: true, application: app });
});

emiRouter.post('/admin/applications/:id/hold', async (req, res) => {
  const id = req.params.id;
  const note = req.body.note || 'Placed on hold';
  const app = await EmiApplication.findById(id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  app.status = 'on_hold';
  app.adminNote = note;
  await app.save();
  await sendCustomerEmail(app.customer?.email ?? '', 'EMI Application On Hold', `<p>Your EMI application has been placed on hold. Note: ${note}</p>`);
  res.json({ ok: true });
});

emiRouter.post('/applications/:id/generate-agreement', async (req, res) => {
  const id = req.params.id;
  const app = await EmiApplication.findById(id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  try {
    const result = await enqueueAgreementGeneration(id, app.toObject());
    if (result && (result as any).url) {
      app.agreementPdfUrl = (result as any).url;
      await app.save();
      res.json({ url: app.agreementPdfUrl });
      return;
    }
    res.json({ queued: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Upload signature image (admin or customer)
emiRouter.post('/admin/applications/:id/signature', upload.single('signature'), async (req, res) => {
  const id = req.params.id;
  const app = await EmiApplication.findById(id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  const file = (req as any).file;
  if (!file) return res.status(400).json({ error: 'File required' });

  // Validate signature file (images only, max 2MB)
  const check = validateFile(file, ['image/png', 'image/jpeg'], 2 * 1024 * 1024);
  if (!check.ok) {
    res.status(400).json({ error: `Signature upload failed: ${check.error}` });
    return;
  }
  const clean = await scanBuffer(file.buffer);
  if (!clean) {
    res.status(400).json({ error: 'Signature failed virus scan' });
    return;
  }

  // If Cloudinary is configured, upload there and return secure URL
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const result: any = await new Promise((resolve, reject) => {
        const stream = cloudinaryV2.uploader.upload_stream({ folder: 'xpc/signatures', resource_type: 'image' }, (err: any, resu: any) => {
          if (err) reject(err);
          else resolve(resu);
        });
        stream.end(file.buffer);
      });
      app.signatureUrl = result.secure_url || result.url;
      await app.save();
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
    }
  }

  // Fallback: save locally
  if (!app.signatureUrl) {
    const uploadsDir = path.resolve('./emi-system/backend/uploads/signatures');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    const outPath = path.join(uploadsDir, `${id}${ext}`);
    fs.writeFileSync(outPath, file.buffer);
    app.signatureUrl = outPath;
    await app.save();
  }

  // Auto-generate agreement after signature upload
  try {
    const result = await enqueueAgreementGeneration(id, app.toObject());
    if (result && (result as any).url) {
      app.agreementPdfUrl = (result as any).url;
      await app.save();
    }
  } catch (err) {
    console.error('Failed to generate agreement after signature upload', err);
  }

  res.json({ url: app.signatureUrl, agreementUrl: app.agreementPdfUrl });
});

// S3 presign endpoint for direct client uploads (returns a pre-signed PUT URL)
emiRouter.post('/presign', async (req, res) => {
  if (!s3Client || !process.env.AWS_S3_BUCKET) return res.status(400).json({ error: 'S3 not configured' });
  const { key, contentType } = req.body || {};
  if (!key || !contentType) return res.status(400).json({ error: 'key and contentType required' });
  try {
    const bucket = process.env.AWS_S3_BUCKET as string;
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
    res.json({ url, key, expiresIn: 300 });
  } catch (err) {
    console.error('presign failed', err);
    res.status(500).json({ error: 'presign failed' });
  }
});

export default emiRouter;
