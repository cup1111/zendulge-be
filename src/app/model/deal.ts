import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: number; // Duration in minutes
  sections: number; // Number of sections (endTime = duration * sections)
  operatingSite: string[]; // Array of Operating Site ID references
  allDay: boolean; // Whether the deal is available all day
  startDate: Date; // When the deal starts (start of recurring pattern)
  endDate?: Date; // When the deal ends (end of recurring pattern, optional for recurring deals)
  recurrenceType: 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'annually';
  maxBookings?: number;
  currentBookings: number;
  status: 'active' | 'inactive' | 'expired' | 'sold_out';
  images?: string[];
  tags?: string[];
  business: string; // Business ID reference
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
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 1440, // up to 24 hours
  },
  sections: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  operatingSite: {
    type: [String],
    required: true,
    ref: 'operateSites',
  },
  allDay: {
    type: Boolean,
    required: true,
    default: false,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: false,
  },
  recurrenceType: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'weekdays', 'monthly', 'annually'],
    required: true,
    default: 'none',
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
  business: {
    type: String,
    required: true,
    ref: 'businesses',
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
dealSchema.index({ business: 1, status: 1 });
dealSchema.index({ business: 1, 'operatingSite': 1 });
dealSchema.index({ business: 1, service: 1 });
dealSchema.index({ business: 1, createdBy: 1 });
dealSchema.index({ startDate: 1, endDate: 1 });
dealSchema.index({ startDate: 1, recurrenceType: 1 });

const Deal = mongoose.model<IDealDocument>('deals', dealSchema);
export default Deal;
