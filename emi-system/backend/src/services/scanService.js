"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanBufferWithClam = scanBufferWithClam;
exports.scanBuffer = scanBuffer;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const clamdjs_1 = __importDefault(require("clamdjs"));
const DEFAULT_CLAMD_HOST = '127.0.0.1';
const DEFAULT_CLAMD_PORT = 3310;
async function scanBufferWithClamDaemon(buffer) {
    const host = process.env.CLAMD_HOST || DEFAULT_CLAMD_HOST;
    const port = Number(process.env.CLAMD_PORT || DEFAULT_CLAMD_PORT);
    const scanner = clamdjs_1.default.createScanner(port, host);
    const result = await scanner.scanBuffer(buffer);
    if (typeof result === 'string') {
        return !/FOUND/i.test(result);
    }
    if (result && typeof result === 'object') {
        if ('isInfected' in result) {
            return !result.isInfected;
        }
        if ('viruses' in result) {
            return !result.viruses?.length;
        }
    }
    return true;
}
async function scanBufferWithClam(buffer) {
    if (process.env.CLAMD_HOST || process.env.CLAMD_PORT) {
        return await scanBufferWithClamDaemon(buffer);
    }
    // write buffer to temp file and call clamscan CLI
    const tmpDir = path_1.default.join(os_1.default.tmpdir(), 'xpc-scan');
    if (!fs_1.default.existsSync(tmpDir))
        fs_1.default.mkdirSync(tmpDir, { recursive: true });
    const tmpPath = path_1.default.join(tmpDir, `scan-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
    fs_1.default.writeFileSync(tmpPath, buffer);
    return new Promise((resolve, reject) => {
        // Use `clamscan` CLI. Exit code: 0 => clean, 1 => infected, >1 => error
        const cmd = 'clamscan';
        const args = ['--no-summary', tmpPath];
        (0, child_process_1.execFile)(cmd, args, (err, stdout, stderr) => {
            try {
                fs_1.default.unlinkSync(tmpPath);
            }
            catch (e) {
                // ignore
            }
            if (err) {
                if (err.code === 1) {
                    resolve(false);
                    return;
                }
                reject(new Error(`ClamAV scan failed: ${err.message || stderr || stdout}`));
                return;
            }
            resolve(true);
        });
    });
}
// Fallback wrapper used by routes; if CLAMAV optional env not set, attempt scan and
// if clamscan not available, throw informative error prompting the operator to install it.
async function scanBuffer(buffer) {
    try {
        const ok = await scanBufferWithClam(buffer);
        return ok;
    }
    catch (err) {
        console.error('ClamAV scan error:', err);
        throw err;
    }
}
exports.default = { scanBuffer };
