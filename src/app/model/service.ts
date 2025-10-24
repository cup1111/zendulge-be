import mongoose, { Schema, Document } from 'mongoose';

export interface IService {
  name: string;
  category: string;
  duration: number; // Duration in minutes
  basePrice: number;
  description?: string;
}

export interface IServiceDocument extends IService, Document {}

const serviceSchema = new Schema<IServiceDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 1440, // up to 24 hours
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

const Service = mongoose.model<IServiceDocument>('services', serviceSchema);
export default Service;