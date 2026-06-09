"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emiRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const EmiApplication_1 = require("../models/EmiApplication");
const otpService_1 = require("../services/otpService");
const emailService_1 = require("../services/emailService");
const pdfGenerator_1 = require("../utils/pdfGenerator");
const scanService_1 = require("../services/scanService");
const queue_1 = require("../jobs/queue");
// Ensure worker is started when routes are loaded (worker runs in same process if present)
require("../jobs/pdfWorker");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
// Simple file validator and virus-scan stub
function validateFile(file, allowed, maxBytes) {
    if (!file)
        return { ok: false, error: 'No file' };
    if (file.size > maxBytes)
        return { ok: false, error: 'File too large' };
    if (!allowed.includes(file.mimetype))
        return { ok: false, error: 'Invalid file type' };
    return { ok: true };
}
const s3Client = process.env.AWS_S3_BUCKET && process.env.AWS_REGION ? new client_s3_1.S3Client({ region: process.env.AWS_REGION }) : null;
async function scanBuffer(buf) {
    // Delegate to ClamAV scanning service which calls clamscan/clamd
    return await (0, scanService_1.scanBuffer)(buf);
}
async function enqueueAgreementGeneration(appId, appObj) {
    // If REDIS_URL is configured or pdfQueue is available, enqueue job
    try {
        if (process.env.REDIS_URL) {
            await queue_1.pdfQueue.add({ appId });
            return { queued: true };
        }
    }
    catch (err) {
        console.warn('Failed to enqueue PDF job, falling back to sync generation', err);
    }
    // Fallback: synchronously generate and upload like worker
    const outDir = path_1.default.resolve('./emi-system/backend/tmp');
    if (!fs_1.default.existsSync(outDir))
        fs_1.default.mkdirSync(outDir, { recursive: true });
    const out = path_1.default.join(outDir, `agreement-${appId}.pdf`);
    const dataForPdf = { ...appObj, signaturePath: appObj.signatureUrl };
    await (0, pdfGenerator_1.generateAgreementPdf)(dataForPdf, out);
    // Upload to Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        try {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({ folder: 'xpc/agreements', resource_type: 'auto', public_id: `agreement-${appId}` }, (err, resu) => {
                    if (err)
                        reject(err);
                    else
                        resolve(resu);
                });
                const rs = fs_1.default.createReadStream(out);
                rs.pipe(stream);
            });
            return { url: result.secure_url || result.url };
        }
        catch (err) {
            console.error('Cloudinary upload failed for agreement (sync):', err);
        }
    }
    // Upload to S3 if configured
    if (s3Client && process.env.AWS_S3_BUCKET) {
        try {
            const bucket = process.env.AWS_S3_BUCKET;
            const key = `agreements/agreement-${appId}.pdf`;
            const body = fs_1.default.createReadStream(out);
            await s3Client.send(new client_s3_1.PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/pdf' }));
            const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            return { url: s3Url };
        }
        catch (err) {
            console.error('S3 upload failed for agreement (sync):', err);
        }
    }
    return { url: out };
}
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
exports.emiRouter = (0, express_1.Router)();
// Landing data, calculator, FAQ
exports.emiRouter.get('/landing', (req, res) => {
    res.json({
        hero: { title: 'EMI Finance for Gaming PCs', subtitle: 'Premium plans starting from ₹2999/month' },
    });
});
// Start application
exports.emiRouter.post('/apply', upload.fields([{ name: 'aadhaar' }, { name: 'pan' }]), async (req, res) => {
    try {
        const body = req.body;
        const app = await EmiApplication_1.EmiApplication.create({
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
        const files = req.files;
        if (files) {
            const docs = {};
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
                        const result = await new Promise((resolve, reject) => {
                            const stream = cloudinary_1.v2.uploader.upload_stream({ folder: 'xpc/documents', resource_type: 'auto' }, (err, resu) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve(resu);
                            });
                            stream.end(f.buffer);
                        });
                        docs.aadhaarUrl = result.secure_url || result.url;
                    }
                    catch (err) {
                        console.error('Cloudinary upload failed for aadhaar:', err);
                    }
                }
                if (!docs.aadhaarUrl) {
                    const outDir = path_1.default.resolve('./emi-system/backend/uploads/docs');
                    if (!fs_1.default.existsSync(outDir))
                        fs_1.default.mkdirSync(outDir, { recursive: true });
                    const outPath = path_1.default.join(outDir, `${app._id}-aadhaar${path_1.default.extname(f.originalname) || '.png'}`);
                    fs_1.default.writeFileSync(outPath, f.buffer);
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
                        const result = await new Promise((resolve, reject) => {
                            const stream = cloudinary_1.v2.uploader.upload_stream({ folder: 'xpc/documents', resource_type: 'auto' }, (err, resu) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve(resu);
                            });
                            stream.end(f.buffer);
                        });
                        docs.panUrl = result.secure_url || result.url;
                    }
                    catch (err) {
                        console.error('Cloudinary upload failed for pan:', err);
                    }
                }
                if (!docs.panUrl) {
                    const outDir = path_1.default.resolve('./emi-system/backend/uploads/docs');
                    if (!fs_1.default.existsSync(outDir))
                        fs_1.default.mkdirSync(outDir, { recursive: true });
                    const outPath = path_1.default.join(outDir, `${app._id}-pan${path_1.default.extname(f.originalname) || '.png'}`);
                    fs_1.default.writeFileSync(outPath, f.buffer);
                    docs.panUrl = outPath;
                }
            }
            if (Object.keys(docs).length) {
                app.documents = { ...app.documents, ...docs };
                await app.save();
            }
        }
        // Auto-generate agreement PDF (draft) when documents uploaded
        try {
            const result = await enqueueAgreementGeneration(app._id.toString(), app.toObject());
            if (result && result.url) {
                app.agreementPdfUrl = result.url;
                await app.save();
            }
            else if (result && result.queued) {
                // queued, leave as-is
            }
        }
        catch (err) {
            console.error('Failed to generate/enqueue agreement after doc upload', err);
        }
        // generate OTP and send to mobile
        const otp = await (0, otpService_1.generateOtp)(body.mobile);
        // In prod, DO NOT return OTP. Here for testing only:
        await (0, emailService_1.sendAdminNotification)(app);
        await (0, emailService_1.sendCustomerEmail)(body.email, 'EMI Application Received', '<p>Your application is received.</p>');
        res.status(201).json({ id: app._id, otp });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.emiRouter.post('/verify-otp', async (req, res) => {
    const { target, otp, applicationId } = req.body;
    const ok = await (0, otpService_1.verifyOtp)(target, otp);
    if (!ok) {
        res.status(400).json({ error: 'Invalid or expired OTP' });
        return;
    }
    if (applicationId) {
        await EmiApplication_1.EmiApplication.findByIdAndUpdate(applicationId, { otpVerified: true });
    }
    res.json({ ok: true });
});
// Admin endpoints (should be protected via middleware)
exports.emiRouter.get('/admin/applications', async (req, res) => {
    const apps = await EmiApplication_1.EmiApplication.find().sort({ createdAt: -1 }).limit(200);
    res.json({ applications: apps });
});
exports.emiRouter.post('/admin/applications/:id/approve', async (req, res) => {
    const id = req.params.id;
    const app = await EmiApplication_1.EmiApplication.findById(id);
    if (!app)
        return res.status(404).json({ error: 'Not found' });
    app.status = 'approved';
    await app.save();
    // send email
    await (0, emailService_1.sendCustomerEmail)(app.customer.email, 'EMI Approved', '<p>Your EMI is approved.</p>');
    res.json({ ok: true });
});
exports.emiRouter.post('/admin/applications/:id/reject', async (req, res) => {
    const id = req.params.id;
    const reason = req.body.reason || 'Not specified';
    const app = await EmiApplication_1.EmiApplication.findById(id);
    if (!app)
        return res.status(404).json({ error: 'Not found' });
    app.status = 'rejected';
    app.adminNote = reason;
    await app.save();
    await (0, emailService_1.sendCustomerEmail)(app.customer.email, 'EMI Rejected', `<p>Your EMI was rejected. Reason: ${reason}</p>`);
    res.json({ ok: true });
});
// Admin: update application fields (customer info, address, notes)
exports.emiRouter.patch('/admin/applications/:id', async (req, res) => {
    const id = req.params.id;
    const app = await EmiApplication_1.EmiApplication.findById(id);
    if (!app)
        return res.status(404).json({ error: 'Not found' });
    const body = req.body || {};
    // Allow updating customer fields and adminNote
    if (body.customer) {
        app.customer = { ...app.customer?.toObject?.(), ...body.customer };
    }
    if (typeof body.adminNote !== 'undefined')
        app.adminNote = body.adminNote;
    if (typeof body.kycVerified !== 'undefined')
        app.kycVerified = !!body.kycVerified;
    await app.save();
    res.json({ ok: true, application: app });
});
exports.emiRouter.post('/admin/applications/:id/hold', async (req, res) => {
    const id = req.params.id;
    const note = req.body.note || 'Placed on hold';
    const app = await EmiApplication_1.EmiApplication.findById(id);
    if (!app)
        return res.status(404).json({ error: 'Not found' });
    app.status = 'on_hold';
    app.adminNote = note;
    await app.save();
    await (0, emailService_1.sendCustomerEmail)(app.customer.email, 'EMI Application On Hold', `<p>Your EMI application has been placed on hold. Note: ${note}</p>`);
    res.json({ ok: true });
});
exports.emiRouter.post('/applications/:id/generate-agreement', async (req, res) => {
    const id = req.params.id;
    const app = await EmiApplication_1.EmiApplication.findById(id);
    if (!app)
        return res.status(404).json({ error: 'Not found' });
    try {
        const result = await enqueueAgreementGeneration(id, app.toObject());
        if (result && result.url) {
            app.agreementPdfUrl = result.url;
            await app.save();
            res.json({ url: app.agreementPdfUrl });
            return;
        }
        res.json({ queued: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Upload signature image (admin or customer)
exports.emiRouter.post('/admin/applications/:id/signature', upload.single('signature'), async (req, res) => {
    const id = req.params.id;
    const app = await EmiApplication_1.EmiApplication.findById(id);
    if (!app)
        return res.status(404).json({ error: 'Not found' });
    if (!req.file)
        return res.status(400).json({ error: 'File required' });
    // Validate signature file (images only, max 2MB)
    const check = validateFile(req.file, ['image/png', 'image/jpeg'], 2 * 1024 * 1024);
    if (!check.ok) {
        res.status(400).json({ error: `Signature upload failed: ${check.error}` });
        return;
    }
    const clean = await scanBuffer(req.file.buffer);
    if (!clean) {
        res.status(400).json({ error: 'Signature failed virus scan' });
        return;
    }
    // If Cloudinary is configured, upload there and return secure URL
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        try {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({ folder: 'xpc/signatures', resource_type: 'image' }, (err, resu) => {
                    if (err)
                        reject(err);
                    else
                        resolve(resu);
                });
                stream.end(req.file.buffer);
            });
            app.signatureUrl = result.secure_url || result.url;
            await app.save();
        }
        catch (err) {
            console.error('Cloudinary upload failed:', err);
        }
    }
    // Fallback: save locally
    if (!app.signatureUrl) {
        const uploadsDir = path_1.default.resolve('./emi-system/backend/uploads/signatures');
        if (!fs_1.default.existsSync(uploadsDir))
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        const ext = req.file.mimetype === 'image/png' ? '.png' : '.jpg';
        const outPath = path_1.default.join(uploadsDir, `${id}${ext}`);
        fs_1.default.writeFileSync(outPath, req.file.buffer);
        app.signatureUrl = outPath;
        await app.save();
    }
    // Auto-generate agreement after signature upload
    try {
        const result = await enqueueAgreementGeneration(id, app.toObject());
        if (result && result.url) {
            app.agreementPdfUrl = result.url;
            await app.save();
        }
    }
    catch (err) {
        console.error('Failed to generate agreement after signature upload', err);
    }
    res.json({ url: app.signatureUrl, agreementUrl: app.agreementPdfUrl });
});
// S3 presign endpoint for direct client uploads (returns a pre-signed PUT URL)
exports.emiRouter.post('/presign', async (req, res) => {
    if (!s3Client || !process.env.AWS_S3_BUCKET)
        return res.status(400).json({ error: 'S3 not configured' });
    const { key, contentType } = req.body || {};
    if (!key || !contentType)
        return res.status(400).json({ error: 'key and contentType required' });
    try {
        const bucket = process.env.AWS_S3_BUCKET;
        const command = new client_s3_1.PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 60 * 5 });
        res.json({ url, key, expiresIn: 300 });
    }
    catch (err) {
        console.error('presign failed', err);
        res.status(500).json({ error: 'presign failed' });
    }
});
exports.default = exports.emiRouter;
