import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true, _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    mrp: {
      type: Number,
      min: 0,
      validate: {
        validator(this: any, value: number) {
          return value == null || this.price == null || value >= this.price;
        },
        message: 'MRP must be greater than or equal to the selling price',
      },
    },
    category: { type: String, default: 'general', trim: true },
    imageUrls: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    newProduct: { type: Boolean, default: false },
    specifications: { type: Map, of: String, default: {} },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true }
);

export type ProductDoc = mongoose.InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Product = mongoose.model('Product', productSchema);
