import mongoose, { Document, Schema } from 'mongoose';

export interface IOpeningHours {
  monday: { open: string; close: string; isClosed: boolean };
  tuesday: { open: string; close: string; isClosed: boolean };
  wednesday: { open: string; close: string; isClosed: boolean };
  thursday: { open: string; close: string; isClosed: boolean };
  friday: { open: string; close: string; isClosed: boolean };
  saturday: { open: string; close: string; isClosed: boolean };
  sunday: { open: string; close: string; isClosed: boolean };
}

export interface IStore {
  name: string;
  address: string;
  companyId: mongoose.Types.ObjectId;
  isActive: boolean;
  longitude: number;
  latitude: number;
  openingHours: IOpeningHours;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreDocument extends IStore, Document {
  _id: mongoose.Types.ObjectId;
}

const openingHoursSchema = new Schema({
  monday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isClosed: { type: Boolean, default: false },
  },
  tuesday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isClosed: { type: Boolean, default: false },
  },
  wednesday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isClosed: { type: Boolean, default: false },
  },
  thursday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isClosed: { type: Boolean, default: false },
  },
  friday: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '17:00' },
    isClosed: { type: Boolean, default: false },
  },
  saturday: {
    open: { type: String, default: '10:00' },
    close: { type: String, default: '16:00' },
    isClosed: { type: Boolean, default: false },
  },
  sunday: {
    open: { type: String, default: '10:00' },
    close: { type: String, default: '16:00' },
    isClosed: { type: Boolean, default: true },
  },
}, { _id: false });

const storeSchema = new Schema<IStoreDocument>({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters'],
  },
  address: {
    type: String,
    required: [true, 'Store address is required'],
    trim: true,
    maxlength: [255, 'Address cannot exceed 255 characters'],
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Company ID is required'],
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180'],
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90'],
  },
  openingHours: {
    type: openingHoursSchema,
    required: true,
    default: () => ({}),
  },
}, {
  timestamps: true,
  collection: 'stores',
});

// Indexes for better query performance
storeSchema.index({ companyId: 1, isActive: 1 });
storeSchema.index({ longitude: 1, latitude: 1 }); // For geospatial queries
storeSchema.index({ name: 'text', address: 'text' }); // For text search

// Create a 2dsphere index for geospatial queries
storeSchema.index({ location: '2dsphere' });

// Virtual for location (GeoJSON format)
storeSchema.virtual('location').get(function () {
  return {
    type: 'Point',
    coordinates: [this.longitude, this.latitude],
  };
});

// Ensure virtual fields are serialized
storeSchema.set('toJSON', { virtuals: true });
storeSchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate coordinates
storeSchema.pre('save', function (next) {
  if (this.longitude < -180 || this.longitude > 180) {
    return next(new Error('Longitude must be between -180 and 180'));
  }
  if (this.latitude < -90 || this.latitude > 90) {
    return next(new Error('Latitude must be between -90 and 90'));
  }
  next();
});

// Static method to find stores near a location
storeSchema.statics.findNearby = function (longitude: number, latitude: number, maxDistance: number = 10000) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'distance',
        maxDistance,
        spherical: true,
        query: { isActive: true },
      },
    },
  ]);
};

// Instance method to check if store is open at a specific time
storeSchema.methods.isOpenAt = function (day: string, time: string): boolean {
  const dayLower = day.toLowerCase() as keyof IOpeningHours;
  const dayHours = this.openingHours[dayLower];
  
  if (dayHours.isClosed) {
    return false;
  }
  
  const openTime = dayHours.open;
  const closeTime = dayHours.close;
  
  return time >= openTime && time <= closeTime;
};

// Instance method to get current status
storeSchema.methods.getCurrentStatus = function (): string {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
  
  if (this.isOpenAt(currentDay, currentTime)) {
    return 'Open';
  }
  return 'Closed';
};

const Store = mongoose.model<IStoreDocument>('Store', storeSchema);

export default Store;
