"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAgreementPdf = generateAgreementPdf;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_lib_1 = require("pdf-lib");
async function generateAgreementPdf(data, outPath) {
    // Ensure output directory exists
    const dir = path_1.default.dirname(outPath);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4-ish
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
    const margin = 40;
    let y = height - margin;
    page.drawText('XPC Builders - EMI Agreement', { x: margin, y: y - 10, size: 18, font: fontBold, color: (0, pdf_lib_1.rgb)(0.2, 0.6, 0.9) });
    y -= 36;
    page.drawText(`Customer: ${data.customer?.fullName || ''}`, { x: margin, y: y, size: 12, font, color: (0, pdf_lib_1.rgb)(1, 1, 1) });
    y -= 18;
    page.drawText(`Email: ${data.customer?.email || ''}`, { x: margin, y: y, size: 11, font, color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9) });
    y -= 16;
    page.drawText(`Mobile: ${data.customer?.mobile || ''}`, { x: margin, y: y, size: 11, font, color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9) });
    y -= 18;
    const addr = `${data.customer?.address || ''} ${data.customer?.city || ''} ${data.customer?.state || ''} ${data.customer?.pincode || ''}`;
    page.drawText(`Address: ${addr}`, { x: margin, y: y, size: 10, font, color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9), maxWidth: width - margin * 2 });
    y -= 36;
    // EMI plan
    const plan = data.emiPlan || {};
    page.drawText('EMI Plan', { x: margin, y: y, size: 14, font: fontBold, color: (0, pdf_lib_1.rgb)(0.8, 0.6, 1) });
    y -= 20;
    page.drawText(`Product Price: ₹${plan.productPrice ?? 0}`, { x: margin, y: y, size: 11, font, color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9) });
    y -= 14;
    page.drawText(`Down Payment: ₹${plan.downPayment ?? 0}`, { x: margin, y: y, size: 11, font, color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9) });
    y -= 14;
    page.drawText(`Interest Rate (annual): ${plan.interestRate ?? 0}%`, { x: margin, y: y, size: 11, font, color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9) });
    y -= 14;
    page.drawText(`Tenure: ${plan.tenureMonths ?? plan.tenure ?? 0} months`, { x: margin, y: y, size: 11, font, color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9) });
    y -= 18;
    page.drawText(`Monthly EMI: ₹${Math.round(plan.monthlyAmount ?? 0)}`, { x: margin, y: y, size: 12, font: fontBold, color: (0, pdf_lib_1.rgb)(0.6, 0.9, 0.8) });
    y -= 36;
    // Terms placeholder
    const terms = 'By signing this agreement, the customer agrees to the EMI schedule and automatic debit consent (if enabled). XPC Builders is a facilitator and not a bank. Credit decisions and disbursals are subject to verification.';
    page.drawText('Terms and Conditions', { x: margin, y: y, size: 12, font: fontBold, color: (0, pdf_lib_1.rgb)(0.8, 0.8, 1) });
    y -= 16;
    page.drawText(terms, { x: margin, y: y, size: 9, font, color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9), maxWidth: width - margin * 2 });
    y -= 80;
    // Signature image if present. Accept local path or remote URL.
    if (data.signaturePath) {
        try {
            let imgBytes;
            let contentType = null;
            if (String(data.signaturePath).startsWith('http')) {
                // fetch remote
                // global fetch is available in modern Node; fallback to require('node-fetch') if necessary
                // @ts-ignore
                const resp = await fetch(data.signaturePath);
                if (resp.ok) {
                    const ab = await resp.arrayBuffer();
                    imgBytes = new Uint8Array(ab);
                    contentType = resp.headers.get('content-type');
                }
            }
            else if (fs_1.default.existsSync(String(data.signaturePath))) {
                const b = fs_1.default.readFileSync(String(data.signaturePath));
                imgBytes = new Uint8Array(b);
                const ext = String(data.signaturePath).toLowerCase();
                contentType = ext.endsWith('.png') ? 'image/png' : 'image/jpeg';
            }
            if (imgBytes) {
                let image;
                if (contentType === 'image/png' || String(data.signaturePath).toLowerCase().endsWith('.png')) {
                    image = await pdfDoc.embedPng(imgBytes);
                }
                else {
                    image = await pdfDoc.embedJpg(imgBytes);
                }
                const imgDims = image.scale(0.5);
                page.drawImage(image, { x: margin, y: y - imgDims.height, width: imgDims.width, height: imgDims.height });
                page.drawText('Signature', { x: margin, y: y - imgDims.height - 14, size: 10, font, color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9) });
            }
        }
        catch (err) {
            // ignore embedding errors
            console.error('Embed signature error:', err);
        }
    }
    const pdfBytes = await pdfDoc.save();
    fs_1.default.writeFileSync(outPath, pdfBytes);
    return outPath;
}
