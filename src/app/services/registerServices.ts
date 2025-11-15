import User from '../model/user';
import Business from '../model/business';
import userService from './userService';
import emailService from './emailService';
import {
  EmailAlreadyExistsException,
  BusinessAlreadyExistsException,
} from '../exceptions';
import { BusinessStatus } from '../enum/businessStatus';

// Helper function to generate activation code and send email
const generateAndSendActivationEmail = async (user: any) => {
  const activationCode =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Handle both transformed (id) and non-transformed (_id) user objects
  const userId = user.id || user._id;
  if (!userId) {
    throw new Error('User object is missing both id and _id fields');
  }

  await userService.updateActivationCode(userId.toString(), activationCode);
  await emailService.sendVerificationEmail(user.email, activationCode);
};

export interface IBusinessRegistration {
  // User data
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;

  // Business data
  businessName: string;
  businessEmail: string;
  businessDescription?: string;
  categories: string[];
  businessAddress: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country?: string;
  };
  abn?: string;
  businessWebsite?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  logo?: string;
}

export interface ICustomerRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
}

export const businessRegister = async (
  registrationData: IBusinessRegistration,
) => {
  const {
    email,
    password,
    firstName,
    lastName,
    jobTitle,
    businessName,
    businessEmail,
    businessDescription,
    categories,
    businessAddress,
    abn,
    businessWebsite,
    facebookUrl,
    twitterUrl,
    logo,
  } = registrationData;

  // Prepare user data
  const userData = {
    email,
    password,
    firstName,
    lastName,
    jobTitle,
    active: false, // Will be activated after email verification
  };

  const existingUser = await User.findByEmail(email);

  if (existingUser) {
    // If user exists and is active, return error
    if (existingUser.active) {
      throw new EmailAlreadyExistsException();
    }

    // If user exists but not active, resend activation email
    await generateAndSendActivationEmail(existingUser);

    return {
      success: true,
      message:
        'Account exists but not activated. A new verification email has been sent.',
      user: {
        id: existingUser.id || existingUser._id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      },
    };
  }

  // Check if business name already exists
  const existingBusiness = await Business.isNameTaken(businessName);
  if (existingBusiness) {
    throw new BusinessAlreadyExistsException();
  }

  // Create the user
  const user = await userService.store({ ...userData, active: false });

  // Get user ID (handle both transformed and non-transformed objects)
  const userId = user.id || user._id;
  if (!userId) {
    throw new Error('User creation failed - no ID returned');
  }

  // Prepare business data
  const businessData = {
    name: businessName,
    email: businessEmail,
    description: businessDescription,
    categories,
    businessAddress: {
      ...businessAddress,
      country: businessAddress.country || 'Australia',
    },
    contact: userId, // The registering user becomes the contact person
    abn,
    website: businessWebsite,
    facebookUrl,
    twitterUrl,
    logo,
    owner: userId,
    status: BusinessStatus.PENDING, // New businesses start with pending status
  };

  // Create the business
  const business = new Business(businessData);
  await business.save();

  // Generate activation code and send email
  await generateAndSendActivationEmail(user);

  return {
    success: true,
    user: {
      id: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    business: {
      id: business.id || business._id,
      name: business.name,
    },
    message:
      'Registration successful. Please check your email to verify your account.',
  };
};

export const customerRegister = async (
  registrationData: ICustomerRegistration,
) => {
  const { email, password, firstName, lastName, jobTitle } = registrationData;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);

  if (existingUser) {
    // If user exists and is active, return error
    if (existingUser.active) {
      throw new EmailAlreadyExistsException();
    }

    // If user exists but not active, resend activation email
    await generateAndSendActivationEmail(existingUser);

    return {
      success: true,
      message:
        'Account exists but not activated. A new verification email has been sent.',
      user: {
        id: existingUser.id || existingUser._id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      },
    };
  }

  // Create new user if doesn't exist
  const userData = {
    email,
    password,
    firstName,
    lastName,
    jobTitle,
    active: false,
  };

  const user = await userService.store(userData);

  // Get user ID (handle both transformed and non-transformed objects)
  const userId = user.id || user._id;
  if (!userId) {
    throw new Error('User creation failed - no ID returned');
  }

  // Generate activation code and send email
  await generateAndSendActivationEmail(user);

  return {
    success: true,
    message:
      'Customer registered successfully. Please check your email to verify your account.',
    user: {
      id: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
};

export default {
  businessRegister,
  customerRegister,
};
