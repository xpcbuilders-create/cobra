import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import clamdjs from 'clamdjs';

const DEFAULT_CLAMD_HOST = '127.0.0.1';
const DEFAULT_CLAMD_PORT = 3310;

async function scanBufferWithClamDaemon(buffer: Buffer): Promise<boolean> {
  const host = process.env.CLAMD_HOST || DEFAULT_CLAMD_HOST;
  const port = Number(process.env.CLAMD_PORT || DEFAULT_CLAMD_PORT);
  const scanner = clamdjs.createScanner(port, host);
  const result = await scanner.scanBuffer(buffer);
  if (typeof result === 'string') {
    return !/FOUND/i.test(result);
  }
  if (result && typeof result === 'object') {
    if ('isInfected' in result) {
      return !(result as any).isInfected;
    }
    if ('viruses' in result) {
      return !(result as any).viruses?.length;
    }
  }
  return true;
}

export async function scanBufferWithClam(buffer: Buffer): Promise<boolean> {
  if (process.env.CLAMD_HOST || process.env.CLAMD_PORT) {
    return await scanBufferWithClamDaemon(buffer);
  }

  // write buffer to temp file and call clamscan CLI
  const tmpDir = path.join(os.tmpdir(), 'xpc-scan');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `scan-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
  fs.writeFileSync(tmpPath, buffer);

  return new Promise<boolean>((resolve, reject) => {
    // Use `clamscan` CLI. Exit code: 0 => clean, 1 => infected, >1 => error
    const cmd = 'clamscan';
    const args = ['--no-summary', tmpPath];
    execFile(cmd, args, (err, stdout, stderr) => {
      try {
        fs.unlinkSync(tmpPath);
      } catch (e) {
        // ignore
      }
      if (err) {
        if ((err as any).code === 1) {
          resolve(false);
          return;
        }
        reject(new Error(`ClamAV scan failed: ${(err as any).message || stderr || stdout}`));
        return;
      }
      resolve(true);
    });
  });
}

// Fallback wrapper used by routes; if CLAMAV optional env not set, attempt scan and
// if clamscan not available, throw informative error prompting the operator to install it.
export async function scanBuffer(buffer: Buffer): Promise<boolean> {
  try {
    const ok = await scanBufferWithClam(buffer);
    return ok;
  } catch (err) {
    console.error('ClamAV scan error:', err);
    throw err;
  }
}

export default { scanBuffer };
