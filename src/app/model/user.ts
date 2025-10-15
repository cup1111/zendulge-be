import mongoose, { CallbackWithoutResultAndOptionalError, Schema, Types } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import config from '../config/app';
import * as bcrypt from 'bcrypt';
import { winstonLogger } from '../../loaders/logger';

export interface IProjectRole {
  project: Types.ObjectId;
  role: Types.ObjectId;
}

export interface IUser {
  email: string;
  password?: string;
  isSuperUser?: number;
  role?: Types.ObjectId; // Reference to Role model
  refreshToken?: string;
  activeCode?: string;
  active: boolean;
  projectsRoles?: IProjectRole[];
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  avatarIcon?: string;
  abbreviation?: string;
  userName?: string;
}



export interface IUserDocument extends IUser, mongoose.Document {
  generateAuthToken(): Promise<{ token: string; refreshToken: string }>;
  activeAccount(): void;
  toJSON(): object;
}

export interface IUserModel extends mongoose.Model<IUserDocument> {
  findByCredentials(email: string, password: string): Promise<IUserDocument | null | undefined>;
  saveInfo(email: string, firstName: string, lastName: string, password: string): Promise<IUserDocument>;
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      trim: true,
    },
    refreshToken: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      trim: true,
      required: true,
      default: false,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    avatarIcon: {
      type: String,
    },
    userName: {
      type: String,
      trim: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'roles',
      index: true,
    },
  },
  { timestamps: true },
);
//limitation for 16MB //AWS 16KB
userSchema.statics.findByCredentials = async function (email: string, password: string) {
  const user = await this.findOne({ email }).exec();
  if (!user) {
    return null;
  }
  if (user.active === false) {
    winstonLogger.info('User has not active account:' + email);
    return undefined;
  }

  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    return null;
  }
  return user;
};

userSchema.statics.saveInfo = async function (email: string, firstName: string, lastName: string, password: string) {
  const user = await this.findOneAndUpdate(
    { email },
    { password: await bcrypt.hash(password, 8), firstName, lastName, activeCode: '' },
    { new: true },
  ).exec();
  if (!user) throw new Error('Cannot find user');
  return user;
};

userSchema.statics.findByEmail = async function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).exec();
};

userSchema.pre('save', async function (this: any, next: CallbackWithoutResultAndOptionalError) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  const id = userObject._id;
  userObject.id = id;
  delete userObject._id;
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.refreshToken;
  delete userObject.activeCode;
  delete userObject.active;
  delete userObject.__v;
  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  
  // Populate role to include basic role info in JWT
  await user.populate('role');
  
  // Get companies this user has access to (owner or member)
  const Company = mongoose.model('companies');
  const userCompanies = await Company.find({
    $or: [
      { owner: user._id },
      { 'members.user': user._id },
    ],
    isActive: true,
  }).select('_id name').lean();
  
  const payload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    userName: user.userName || null,
    avatarIcon: user.avatarIcon || null,
    role: user.role?.slug || null, // Include role slug for frontend decisions
    companies: userCompanies.map((c: any) => ({ id: c._id, name: c.name })),
  };
  
  const token = jwt.sign(payload, config.accessSecret, {
    expiresIn: '48h',
  });
  const refreshToken = jwt.sign({ id: user.id }, config.accessSecret, { expiresIn: '360h' });
  user.refreshToken = refreshToken;
  await user.save();

  return { token, refreshToken };
};

userSchema.methods.activeAccount = function () {
  const user = this;
  user.active = true;
  user.save();
};

const User = mongoose.model<IUserDocument, IUserModel>('users', userSchema);
export default User;