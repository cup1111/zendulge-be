import mongoose, { Schema, Types, Document, mongo } from 'mongoose';

export interface ICompany {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  logo?: string;
  owner: Types.ObjectId; // Reference to User who created the company
  members?: Types.ObjectId[]; // Other users who can access this company
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICompanyDocument = ICompany & Document;

const companySchema = new Schema<ICompanyDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid URL',
      },
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    },
    location: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'users',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for better performance
companySchema.index({ owner: 1, isActive: 1 });
companySchema.index({ name: 1 });

// Virtual to populate owner details
companySchema.virtual('ownerDetails', {
  ref: 'users',
  localField: 'owner',
  foreignField: '_id',
  justOne: true,
});

// Virtual to populate member details
companySchema.virtual('memberDetails', {
  ref: 'users',
  localField: 'members',
  foreignField: '_id',
});

// Static method to find companies by owner
companySchema.statics.findByOwner = function (ownerId: Types.ObjectId) {
  return this.find({ owner: ownerId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find companies where user is owner or member
companySchema.statics.findByUser = function (userId: Types.ObjectId) {
  return this.find({ 
    $or: [
      { owner: userId },
      { members: userId },
    ],
    isActive: true,
  }).sort({ createdAt: -1 });
};

// Instance method to add member
companySchema.methods.addMember = function (userId: Types.ObjectId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove member
companySchema.methods.removeMember = function (userId: Types.ObjectId) {
  this.members = this.members.filter((memberId: Types.ObjectId) => 
    !memberId.equals(userId),
  );
  return this.save();
};

export default mongoose.model<ICompanyDocument>('companies', companySchema);
