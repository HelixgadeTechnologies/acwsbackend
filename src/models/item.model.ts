import mongoose, { Model, Schema } from 'mongoose';
import { IItem } from '../interfaces/item.interface';

// ── Schema ────────────────────────────────────────────────────────────────
const itemSchema = new mongoose.Schema<IItem>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// ── Index for faster owner-based queries ──────────────────────────────────
itemSchema.index({ owner: 1 });

const Item: Model<IItem> = mongoose.model<IItem>('Item', itemSchema);

export default Item;
