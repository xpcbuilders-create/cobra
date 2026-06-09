import Queue from 'bull';

const redisUrl = process.env.REDIS_URL;

let _pdfQueue: any = null;
if (redisUrl) {
  _pdfQueue = new Queue('pdfQueue', redisUrl);
  _pdfQueue.on('error', (e: any) => console.error('pdfQueue error', e));
} else {
  // stub queue when Redis not configured — prevents connection errors in dev
  _pdfQueue = {
    add: async () => { throw new Error('Redis not configured'); },
    on: () => {},
    process: () => {},
    close: async () => {},
  };
}

export const pdfQueue = _pdfQueue;

export default pdfQueue;
