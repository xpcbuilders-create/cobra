"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const OTPSchema = new mongoose_1.default.Schema({
    target: String, // phone or email
    otp: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 },
});
exports.OTPModel = mongoose_1.default.model('OTP', OTPSchema);
exports.default = exports.OTPModel;
