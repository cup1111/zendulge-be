import mongoose, { Document, Schema } from 'mongoose';
import { RoleName, getAllRoleNames } from '../enum/roles';

export interface IRole {
  name: RoleName;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleDocument extends IRole, Document {
  _id: mongoose.Types.ObjectId;
}

const roleSchema = new Schema<IRoleDocument>({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters'],
    enum: {
      values: getAllRoleNames(),
      message: 'Invalid role name',
    },
  },
  description: {
    type: String,
    required: [true, 'Role description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
  collection: 'roles',
});

// Index for better query performance
roleSchema.index({ name: 1, isActive: 1 });

// Static method to get role by name
roleSchema.statics.findByName = function (name: string) {
  return this.findOne({ name, isActive: true });
};

const Role = mongoose.model<IRoleDocument>('roles', roleSchema);

export default Role;
