import path from 'path';
import fs from 'fs';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { pdfQueue } from './queue';
import EmiApplication from '../models/EmiApplication';
import { generateAgreementPdf } from '../utils/pdfGenerator';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = process.env.AWS_S3_BUCKET && process.env.AWS_REGION ? new S3Client({ region: process.env.AWS_REGION }) : null;

pdfQueue.process(async (job: any) => {
  const { appId } = job.data as { appId: string };
  try {
    const app = await EmiApplication.findById(appId);
    if (!app) throw new Error('Application not found');
    const outDir = path.resolve('./emi-system/backend/tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const out = path.join(outDir, `agreement-${app._id}.pdf`);
    const dataForPdf = { ...app.toObject(), signaturePath: app.signatureUrl };
    await generateAgreementPdf(dataForPdf, out);

    // If Cloudinary configured, upload
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const result: any = await new Promise((resolve, reject) => {
          const stream = cloudinaryV2.uploader.upload_stream({ folder: 'xpc/agreements', resource_type: 'auto', public_id: `agreement-${app._id}` }, (err: any, resu: any) => {
            if (err) reject(err);
            else resolve(resu);
          });
          const rs = fs.createReadStream(out);
          rs.pipe(stream);
        });
        app.agreementPdfUrl = result.secure_url || result.url;
        await app.save();
        return { url: app.agreementPdfUrl };
      } catch (err) {
        console.error('Cloudinary upload failed for agreement:', err);
      }
    }

    // If S3 configured, upload
    if (s3Client && process.env.AWS_S3_BUCKET) {
      try {
        const bucket = process.env.AWS_S3_BUCKET as string;
        const key = `agreements/agreement-${app._id}.pdf`;
        const body = fs.createReadStream(out);
        await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/pdf' }));
        const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        app.agreementPdfUrl = s3Url;
        await app.save();
        return { url: s3Url };
      } catch (err) {
        console.error('S3 upload failed for agreement:', err);
      }
    }

    // fallback: keep local path
    app.agreementPdfUrl = out;
    await app.save();
    return { url: out };
  } catch (err) {
    console.error('pdfWorker failed', err);
    throw err;
  }
});

pdfQueue.on('completed', (job: any, result: any) => {
  console.log('PDF job completed', job.id, result);
});

pdfQueue.on('failed', (job: any, err: any) => {
  console.error('PDF job failed', job.id, err);
});
