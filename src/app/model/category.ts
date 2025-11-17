import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  icon: string;
  isActive?: boolean;
}

export interface ICategoryDocument extends ICategory, Document { }

const categorySchema = new Schema<ICategoryDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true,
    index: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  },
  icon: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Index for better query performance
categorySchema.index({ isActive: 1, slug: 1 });

// Static method to find active categories
categorySchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find by slug
categorySchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug, isActive: true });
};

const Category = mongoose.model<ICategoryDocument>('categories', categorySchema);
export default Category;

