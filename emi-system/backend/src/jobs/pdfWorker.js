"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = require("cloudinary");
const queue_1 = require("./queue");
const EmiApplication_1 = __importDefault(require("../models/EmiApplication"));
const pdfGenerator_1 = require("../utils/pdfGenerator");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3Client = process.env.AWS_S3_BUCKET && process.env.AWS_REGION ? new client_s3_1.S3Client({ region: process.env.AWS_REGION }) : null;
queue_1.pdfQueue.process(async (job) => {
    const { appId } = job.data;
    try {
        const app = await EmiApplication_1.default.findById(appId);
        if (!app)
            throw new Error('Application not found');
        const outDir = path_1.default.resolve('./emi-system/backend/tmp');
        if (!fs_1.default.existsSync(outDir))
            fs_1.default.mkdirSync(outDir, { recursive: true });
        const out = path_1.default.join(outDir, `agreement-${app._id}.pdf`);
        const dataForPdf = { ...app.toObject(), signaturePath: app.signatureUrl };
        await (0, pdfGenerator_1.generateAgreementPdf)(dataForPdf, out);
        // If Cloudinary configured, upload
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
            try {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary_1.v2.uploader.upload_stream({ folder: 'xpc/agreements', resource_type: 'auto', public_id: `agreement-${app._id}` }, (err, resu) => {
                        if (err)
                            reject(err);
                        else
                            resolve(resu);
                    });
                    const rs = fs_1.default.createReadStream(out);
                    rs.pipe(stream);
                });
                app.agreementPdfUrl = result.secure_url || result.url;
                await app.save();
                return { url: app.agreementPdfUrl };
            }
            catch (err) {
                console.error('Cloudinary upload failed for agreement:', err);
            }
        }
        // If S3 configured, upload
        if (s3Client && process.env.AWS_S3_BUCKET) {
            try {
                const bucket = process.env.AWS_S3_BUCKET;
                const key = `agreements/agreement-${app._id}.pdf`;
                const body = fs_1.default.createReadStream(out);
                await s3Client.send(new client_s3_1.PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/pdf' }));
                const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
                app.agreementPdfUrl = s3Url;
                await app.save();
                return { url: s3Url };
            }
            catch (err) {
                console.error('S3 upload failed for agreement:', err);
            }
        }
        // fallback: keep local path
        app.agreementPdfUrl = out;
        await app.save();
        return { url: out };
    }
    catch (err) {
        console.error('pdfWorker failed', err);
        throw err;
    }
});
queue_1.pdfQueue.on('completed', (job, result) => {
    console.log('PDF job completed', job.id, result);
});
queue_1.pdfQueue.on('failed', (job, err) => {
    console.error('PDF job failed', job.id, err);
});
