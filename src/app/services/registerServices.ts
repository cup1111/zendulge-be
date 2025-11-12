import User from '../model/user';
import Company from '../model/company';
import userService from './userService';
import emailService from './emailService';
import {
  EmailAlreadyExistsException,
  CompanyAlreadyExistsException,
} from '../exceptions';

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

  // Company data
  companyName: string;
  companyEmail: string;
  companyDescription?: string;
  categories: string[];
  businessAddress: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country?: string;
  };
  abn?: string;
  companyWebsite?: string;
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
    companyName,
    companyEmail,
    companyDescription,
    categories,
    businessAddress,
    abn,
    companyWebsite,
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

  // Check if company name already exists
  const existingCompany = await Company.isNameTaken(companyName);
  if (existingCompany) {
    throw new CompanyAlreadyExistsException();
  }

  // Create the user
  const user = await userService.store(userData);

  // Get user ID (handle both transformed and non-transformed objects)
  const userId = user.id || user._id;
  if (!userId) {
    throw new Error('User creation failed - no ID returned');
  }

  // Prepare company data
  const companyData = {
    name: companyName,
    email: companyEmail,
    description: companyDescription,
    categories,
    businessAddress: {
      ...businessAddress,
      country: businessAddress.country || 'Australia',
    },
    contact: userId, // The registering user becomes the contact person
    abn,
    website: companyWebsite,
    facebookUrl,
    twitterUrl,
    logo,
    owner: userId,
    isActive: true,
  };

  // Create the company
  const company = new Company(companyData);
  await company.save();

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
    company: {
      id: company.id || company._id,
      name: company.name,
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
