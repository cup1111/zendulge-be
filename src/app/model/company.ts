import mongoose, { Schema, Types, Document } from 'mongoose';

export interface ICompany {
  name: string;
  description?: string;
  website?: string;
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
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters long'],
      maxlength: [100, 'Company name cannot exceed 100 characters'],
      validate: {
        validator: function (v: string) {
          return /^[a-zA-Z0-9\s\-&.,()]+$/.test(v);
        },
        message: 'Company name contains invalid characters',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Company description cannot exceed 500 characters'],
      validate: {
        validator: function (v: string) {
          return !v || v.length >= 10;
        },
        message: 'Company description must be at least 10 characters if provided',
      },
    },
    website: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(v);
        },
        message: 'Please provide a valid website URL (must include http:// or https://)',
      },
    },
    logo: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i.test(v);
        },
        message: 'Logo must be a valid image URL (jpg, jpeg, png, gif, svg)',
      },
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
      validate: {
        validator: function (v: Types.ObjectId[]) {
          return !v || v.length <= 100; // Max 100 members per company
        },
        message: 'Company cannot have more than 100 members',
      },
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

// Pre-save middleware
companySchema.pre('save', function (next) {
  // Ensure owner is not in members array
  if (this.members && this.owner) {
    this.members = this.members.filter((memberId: Types.ObjectId) => 
      !memberId.equals(this.owner),
    );
  }
  
  // Remove duplicate members
  if (this.members && this.members.length > 0) {
    this.members = [...new Set(this.members.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
  }
  
  next();
});

// Indexes for better performance
companySchema.index({ owner: 1, isActive: 1 });
companySchema.index({ name: 1 });
companySchema.index({ name: 'text', description: 'text' }); // Text search index

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

// Static method to search companies by name or description
companySchema.statics.search = function (searchTerm: string, userId?: Types.ObjectId) {
  const query: any = {
    $text: { $search: searchTerm },
    isActive: true,
  };
  
  if (userId) {
    query.$or = [
      { owner: userId },
      { members: userId },
    ];
  }
  
  return this.find(query).sort({ score: { $meta: 'textScore' } });
};

// Static method to check if company name exists
companySchema.statics.isNameTaken = function (name: string, excludeId?: Types.ObjectId) {
  const query: any = { 
    name: new RegExp(`^${name}$`, 'i'), // Case insensitive
    isActive: true,
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.findOne(query);
};

// Instance method to add member
companySchema.methods.addMember = function (userId: Types.ObjectId) {
  // Don't add owner as member
  if (this.owner.equals(userId)) {
    throw new Error('Owner cannot be added as a member');
  }
  
  // Check if already a member
  const isAlreadyMember = this.members.some((memberId: Types.ObjectId) => 
    memberId.equals(userId),
  );
  
  if (!isAlreadyMember) {
    // Check member limit
    if (this.members.length >= 100) {
      throw new Error('Company has reached maximum member limit (100)');
    }
    
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

// Instance method to check if user has access (owner or member)
companySchema.methods.hasAccess = function (userId: Types.ObjectId) {
  return this.owner.equals(userId) || 
    this.members.some((memberId: Types.ObjectId) => memberId.equals(userId));
};

// Instance method to transfer ownership
companySchema.methods.transferOwnership = function (newOwnerId: Types.ObjectId) {
  const oldOwnerId = this.owner;
  
  // Remove new owner from members if they are a member
  this.members = this.members.filter((memberId: Types.ObjectId) => 
    !memberId.equals(newOwnerId),
  );
  
  // Add old owner as member
  if (!this.members.some((memberId: Types.ObjectId) => memberId.equals(oldOwnerId))) {
    this.members.push(oldOwnerId);
  }
  
  this.owner = newOwnerId;
  return this.save();
};

export default mongoose.model<ICompanyDocument>('companies', companySchema);
