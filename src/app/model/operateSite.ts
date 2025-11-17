import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOperatingHours {
  monday: { open: string; close: string; isClosed: boolean };
  tuesday: { open: string; close: string; isClosed: boolean };
  wednesday: { open: string; close: string; isClosed: boolean };
  thursday: { open: string; close: string; isClosed: boolean };
  friday: { open: string; close: string; isClosed: boolean };
  saturday: { open: string; close: string; isClosed: boolean };
  sunday: { open: string; close: string; isClosed: boolean };
}

export interface IOperateSite {
  name: string;
  address: string;
  phoneNumber: string;
  emailAddress: string;
  operatingHours: IOperatingHours;
  specialInstruction: string;
  business: mongoose.Types.ObjectId;
  members?: mongoose.Types.ObjectId[]; // Array of user IDs who have access to this operate site
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOperateSiteDocument extends IOperateSite, Document {
  _id: mongoose.Types.ObjectId;
  isOpenAt(day: string, time: string): boolean;
  getCurrentStatus(): string;
  addMember(userId: Types.ObjectId): Promise<IOperateSiteDocument>;
}

const openingHoursSchema = new Schema(
  {
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
  },
  { _id: false },
);

const operateSiteSchema = new Schema<IOperateSiteDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [255, 'Address cannot exceed 255 characters'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    emailAddress: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    operatingHours: {
      type: openingHoursSchema,
      required: true,
      default: () => ({}),
    },
    specialInstruction: {
      type: String,
      trim: true,
      maxlength: [500, 'Special instruction cannot exceed 500 characters'],
      default: '',
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: 'businesses',
      required: [true, 'Business ID is required'],
      index: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'users',
      },
    ],
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'operateSites',
  },
);

// Indexes for better query performance
operateSiteSchema.index({ business: 1, isActive: 1 });
operateSiteSchema.index({ longitude: 1, latitude: 1 }); // For geospatial queries
operateSiteSchema.index({ name: 'text', address: 'text' }); // For text search

// Create a 2dsphere index for geospatial queries
operateSiteSchema.index({ location: '2dsphere' });

// Virtual for location (GeoJSON format)
operateSiteSchema
  .virtual('location')
  .get(function (this: IOperateSiteDocument) {
    return {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
  });

// Ensure virtual fields are serialized
operateSiteSchema.set('toJSON', { virtuals: true });
operateSiteSchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate coordinates and store location field for geospatial index
operateSiteSchema.pre(
  'save',
  function (
    this: IOperateSiteDocument,
    next: mongoose.CallbackWithoutResultAndOptionalError,
  ) {
    if (this.longitude < -180 || this.longitude > 180) {
      return next(new Error('Longitude must be between -180 and 180'));
    }
    if (this.latitude < -90 || this.latitude > 90) {
      return next(new Error('Latitude must be between -90 and 90'));
    }
    // Store location as a real field (not just virtual) for geospatial indexing
    (this as any).location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
    next();
  },
);

// Static method to find operate sites near a location
operateSiteSchema.statics.findNearby = function (
  longitude: number,
  latitude: number,
  maxDistance: number = 10000,
) {
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

operateSiteSchema.methods.addMember = function (
  userId: Types.ObjectId,
) {
  // Check if already a member
  const isAlreadyMember = this.members.some((member: string) =>
    member.toString() === userId.toString(),
  );

  if (!isAlreadyMember) {
    // Check member limit
    if (this.members.length >= 100) {
      throw new Error('Business has reached maximum member limit (100)');
    }

    this.members.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to check if operate site is open at a specific time
operateSiteSchema.methods.isOpenAt = function (
  this: IOperateSiteDocument,
  day: string,
  time: string,
): boolean {
  const dayLower = day.toLowerCase() as keyof IOperatingHours;
  const dayHours = this.operatingHours[dayLower];

  if (dayHours.isClosed) {
    return false;
  }

  const openTime = dayHours.open;
  const closeTime = dayHours.close;

  return time >= openTime && time <= closeTime;
};

// Instance method to get current status
operateSiteSchema.methods.getCurrentStatus = function (
  this: IOperateSiteDocument,
): string {
  const now = new Date();
  const currentDay = now
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();
  const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

  if (this.isOpenAt(currentDay, currentTime)) {
    return 'Open';
  }
  return 'Closed';
};

const OperateSite = mongoose.model<IOperateSiteDocument>(
  'operateSites',
  operateSiteSchema,
);

export default OperateSite;
