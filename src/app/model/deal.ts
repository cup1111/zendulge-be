import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal {
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  duration: number; // Duration in minutes
  operatingSite: string[]; // Array of Operating Site ID references
  availability: {
    startDate: Date;
    endDate: Date;
    maxBookings?: number;
    currentBookings: number;
  };
  status: 'active' | 'inactive' | 'expired' | 'sold_out';
  images?: string[];
  tags?: string[];
  company: string; // Company ID reference
  service: string; // Service ID reference (required)
  createdBy: string; // User ID who created the deal
}

export interface IDealDocument extends IDeal, Document { }

const dealSchema = new Schema<IDealDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 1440, // up to 24 hours
  },
  operatingSite: {
    type: [String],
    required: true,
    ref: 'operateSites',
  },
  availability: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maxBookings: {
      type: Number,
      min: 1,
    },
    currentBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'sold_out'],
    default: 'active',
  },
  images: [{
    type: String,
    trim: true,
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 30,
  }],
  company: {
    type: String,
    required: true,
    ref: 'companies',
  },
  service: {
    type: String,
    required: true,
    ref: 'services',
  },
  createdBy: {
    type: String,
    required: true,
    ref: 'users',
  },
}, {
  timestamps: true,
});

// Index for better query performance
dealSchema.index({ company: 1, status: 1 });
dealSchema.index({ company: 1, 'operatingSite': 1 });
dealSchema.index({ company: 1, service: 1 });
dealSchema.index({ company: 1, createdBy: 1 });
dealSchema.index({ category: 1 });
dealSchema.index({ 'availability.startDate': 1, 'availability.endDate': 1 });

const Deal = mongoose.model<IDealDocument>('deals', dealSchema);
export default Deal;
