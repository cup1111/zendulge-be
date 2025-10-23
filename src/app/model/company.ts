import mongoose, { Schema, Types, Document } from 'mongoose';

export interface ICompanyMember {
  user: Types.ObjectId;
  role: Types.ObjectId;
  joinedAt?: Date;
}

export interface ICompany {
  name: string;
  email: string;
  description?: string;
  serviceCategory: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  contact: Types.ObjectId; // Reference to User who is the contact person
  abn?: string;
  website?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  logo?: string;
  owner: Types.ObjectId; // Reference to User who created the company
  members?: ICompanyMember[]; // Other users who can access this company with their roles
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICompanyDocument = ICompany & Document;

export interface ICompanyModel extends mongoose.Model<ICompanyDocument> {
  findByOwner(
    ownerId: Types.ObjectId,
  ): mongoose.Query<ICompanyDocument[], ICompanyDocument>;
  findByUser(
    userId: Types.ObjectId,
  ): mongoose.Query<ICompanyDocument[], ICompanyDocument>;
  search(
    searchTerm: string,
    userId?: Types.ObjectId,
  ): mongoose.Query<ICompanyDocument[], ICompanyDocument>;
  isNameTaken(
    name: string,
    excludeId?: Types.ObjectId,
  ): Promise<ICompanyDocument | null>;
  isAbnTaken(
    abn: string,
    excludeId?: Types.ObjectId,
  ): Promise<ICompanyDocument | null>;
}

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
    email: {
      type: String,
      required: [true, 'Company email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address',
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
        message:
          'Company description must be at least 10 characters if provided',
      },
    },
    serviceCategory: {
      type: String,
      required: [true, 'Service category is required'],
      trim: true,
      minlength: [2, 'Service category must be at least 2 characters long'],
      maxlength: [50, 'Service category cannot exceed 50 characters'],
    },
    businessAddress: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
        maxlength: [200, 'Street address cannot exceed 200 characters'],
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [100, 'City cannot exceed 100 characters'],
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [50, 'State cannot exceed 50 characters'],
      },
      postcode: {
        type: String,
        required: [true, 'Postcode is required'],
        trim: true,
        validate: {
          validator: function (v: string) {
            return /^\d{4}$/.test(v); // Australian postcode format
          },
          message: 'Please provide a valid Australian postcode (4 digits)',
        },
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        default: 'Australia',
        maxlength: [50, 'Country cannot exceed 50 characters'],
      },
    },
    contact: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: [true, 'Contact person is required'],
      index: true,
    },
    website: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return (
            !v ||
            /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(
              v,
            )
          );
        },
        message:
          'Please provide a valid website URL (must include http:// or https://)',
      },
    },
    facebookUrl: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/(www\.)?facebook\.com\/.+/.test(v);
        },
        message: 'Please provide a valid Facebook URL',
      },
    },
    twitterUrl: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(v);
        },
        message: 'Please provide a valid Twitter/X URL',
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
    abn: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // ABN is optional

          // Remove spaces and ensure it's 11 digits
          const cleanAbn = v.replace(/\s/g, '');
          if (!/^\d{11}$/.test(cleanAbn)) {
            return false;
          }

          // ABN checksum validation
          const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
          let sum = 0;

          // Subtract 1 from the first digit
          const firstDigit = parseInt(cleanAbn[0]) - 1;
          sum += firstDigit * weights[0];

          // Add weighted sum of remaining digits
          for (let i = 1; i < 11; i++) {
            sum += parseInt(cleanAbn[i]) * weights[i];
          }

          return sum % 89 === 0;
        },
        message: 'Please provide a valid Australian Business Number (ABN)',
      },
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'users',
          required: true,
        },
        role: {
          type: Schema.Types.ObjectId,
          ref: 'roles',
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
  // Format ABN - remove spaces and convert to uppercase
  if (this.abn) {
    this.abn = this.abn.replace(/\s/g, '').toUpperCase();
  }

  // Ensure owner is not in members array
  if (this.members && this.owner) {
    this.members = this.members.filter(
      (member: ICompanyMember) => !member.user.equals(this.owner),
    );
  }

  // Remove duplicate members (same user)
  if (this.members && this.members.length > 0) {
    const uniqueMembers = new Map();
    this.members.forEach((member: ICompanyMember) => {
      const userId = member.user.toString();
      if (!uniqueMembers.has(userId)) {
        uniqueMembers.set(userId, member);
      }
    });
    this.members = Array.from(uniqueMembers.values());
  }

  // Validate member limit
  if (this.members && this.members.length > 100) {
    return next(new Error('Company cannot have more than 100 members'));
  }

  next();
});

// Indexes for better performance
companySchema.index({ owner: 1, isActive: 1 });
companySchema.index({ name: 1 });
companySchema.index({ abn: 1 }, { sparse: true }); // Sparse index for optional ABN field
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
    $or: [{ owner: userId }, { 'members.user': userId }],
    isActive: true,
  }).sort({ createdAt: -1 });
};

// Static method to search companies by name or description
companySchema.statics.search = function (
  searchTerm: string,
  userId?: Types.ObjectId,
) {
  const query: any = {
    $text: { $search: searchTerm },
    isActive: true,
  };

  if (userId) {
    query.$or = [{ owner: userId }, { 'members.user': userId }];
  }

  return this.find(query).sort({ score: { $meta: 'textScore' } });
};

// Static method to check if company name exists
companySchema.statics.isNameTaken = function (
  name: string,
  excludeId?: Types.ObjectId,
) {
  const query: any = {
    name: new RegExp(`^${name}$`, 'i'), // Case insensitive
    isActive: true,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.findOne(query);
};

// Static method to check if ABN is already registered
companySchema.statics.isAbnTaken = function (
  abn: string,
  excludeId?: Types.ObjectId,
) {
  if (!abn) return Promise.resolve(null);

  const cleanAbn = abn.replace(/\s/g, '').toUpperCase();
  const query: any = {
    abn: cleanAbn,
    isActive: true,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.findOne(query);
};

// Instance method to add member
companySchema.methods.addMember = function (
  userId: Types.ObjectId,
  roleId: Types.ObjectId,
) {
  // Don't add owner as member
  if (this.owner.equals(userId)) {
    throw new Error('Owner cannot be added as a member');
  }

  // Check if already a member
  const isAlreadyMember = this.members.some((member: ICompanyMember) =>
    member.user.equals(userId),
  );

  if (!isAlreadyMember) {
    // Check member limit
    if (this.members.length >= 100) {
      throw new Error('Company has reached maximum member limit (100)');
    }

    this.members.push({
      user: userId,
      role: roleId,
      joinedAt: new Date(),
    });
    return this.save();
  }

  return Promise.resolve(this);
};

// Instance method to remove member
companySchema.methods.removeMember = function (userId: Types.ObjectId) {
  this.members = this.members.filter(
    (member: ICompanyMember) => !member.user.equals(userId),
  );
  return this.save();
};

// Instance method to check if user has access (owner or member)
companySchema.methods.hasAccess = function (userId: Types.ObjectId) {
  return (
    this.owner.equals(userId) ||
    this.members.some((member: ICompanyMember) => member.user.equals(userId))
  );
};

// Instance method to transfer ownership
companySchema.methods.transferOwnership = function (
  newOwnerId: Types.ObjectId,
  oldOwnerRoleId: Types.ObjectId,
) {
  const oldOwnerId = this.owner;

  // Remove new owner from members if they are a member
  this.members = this.members.filter(
    (member: ICompanyMember) => !member.user.equals(newOwnerId),
  );

  // Add old owner as member with specified role
  if (
    !this.members.some((member: ICompanyMember) =>
      member.user.equals(oldOwnerId),
    )
  ) {
    this.members.push({
      user: oldOwnerId,
      role: oldOwnerRoleId,
      joinedAt: new Date(),
    });
  }

  this.owner = newOwnerId;
  return this.save();
};

// Instance method to update member role
companySchema.methods.updateMemberRole = function (
  userId: Types.ObjectId,
  newRoleId: Types.ObjectId,
) {
  const memberToUpdate = this.members.find((member: ICompanyMember) =>
    member.user.equals(userId),
  );

  if (!memberToUpdate) {
    throw new Error('User is not a member of this company');
  }

  memberToUpdate.role = newRoleId;
  return this.save();
};

// Instance method to get member role
companySchema.methods.getMemberRole = function (userId: Types.ObjectId) {
  const foundMember = this.members.find((member: ICompanyMember) =>
    member.user.equals(userId),
  );

  return foundMember ? foundMember.role : null;
};

// Instance method to get members by role
companySchema.methods.getMembersByRole = function (roleId: Types.ObjectId) {
  return this.members.filter((member: ICompanyMember) =>
    member.role.equals(roleId),
  );
};

const Company = mongoose.model<ICompanyDocument, ICompanyModel>(
  'companies',
  companySchema,
);
export default Company;
