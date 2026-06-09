"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const redisUrl = process.env.REDIS_URL;
let _pdfQueue = null;
if (redisUrl) {
    _pdfQueue = new bull_1.default('pdfQueue', redisUrl);
    _pdfQueue.on('error', (e) => console.error('pdfQueue error', e));
}
else {
    // stub queue when Redis not configured — prevents connection errors in dev
    _pdfQueue = {
        add: async () => { throw new Error('Redis not configured'); },
        on: () => { },
        process: () => { },
        close: async () => { },
    };
}
exports.pdfQueue = _pdfQueue;
exports.default = exports.pdfQueue;
