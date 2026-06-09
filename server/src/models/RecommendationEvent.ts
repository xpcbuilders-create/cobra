import mongoose from 'mongoose';

const recommendationEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    eventType: {
      type: String,
      enum: ['view'],
      default: 'view',
      index: true,
    },
  },
  { timestamps: true }
);

recommendationEventSchema.index({ user: 1, createdAt: -1 });
recommendationEventSchema.index({ product: 1, createdAt: -1 });
recommendationEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export const RecommendationEvent = mongoose.model('RecommendationEvent', recommendationEventSchema);
