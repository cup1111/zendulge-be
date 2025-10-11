import User from '../model/user';
import Company from '../model/company';
import userService from './userService';
import emailService from './emailService';
import { EmailAlreadyExistsException, CompanyAlreadyExistsException } from '../exceptions';

// Helper function to generate activation code and send email
const generateAndSendActivationEmail = async (user: any) => {
  const activationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  await userService.updateActivationCode(user._id.toString(), activationCode);
  await emailService.sendVerificationEmail(user.email, activationCode);
};

export interface IBusinessRegistration {
  // User data
  email: string;
  password: string;
  name: string;
  jobTitle?: string;
  
  // Company data
  companyName: string;
  companyEmail: string;
  companyDescription?: string;
  serviceCategory: string;
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
  name: string;
  jobTitle?: string;
}

export const businessRegister = async (registrationData: IBusinessRegistration) => {
  const { 
    email, 
    password, 
    name, 
    jobTitle,
    companyName,
    companyEmail,
    companyDescription,
    serviceCategory,
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
    name,
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
      message: 'Account exists but not activated. A new verification email has been sent.',
      user: {
        id: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
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

  // Prepare company data
  const companyData = {
    name: companyName,
    email: companyEmail,
    description: companyDescription,
    serviceCategory,
    businessAddress: {
      ...businessAddress,
      country: businessAddress.country || 'Australia',
    },
    contact: user._id, // The registering user becomes the contact person
    abn,
    website: companyWebsite,
    facebookUrl,
    twitterUrl,
    logo,
    owner: user._id,
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
      id: user._id,
      email: user.email,
      name: user.name,
    },
    company: {
      id: company._id,
      name: company.name,
    },
    message: 'Registration successful. Please check your email to verify your account.',
  };
};


export const customerRegister = async (registrationData: ICustomerRegistration) => {
  
  const { email, password, name, jobTitle } = registrationData;

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
      message: 'Account exists but not activated. A new verification email has been sent.',
      user: {
        id: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
      },
    };
  }

  // Create new user if doesn't exist
  const userData = {
    email,
    password,
    name,
    jobTitle,
    active: false,
  };

  const user = await userService.store(userData);

  // Generate activation code and send email
  await generateAndSendActivationEmail(user);

  return {
    success: true,
    message: 'Customer registered successfully. Please check your email to verify your account.',
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  };
};

export default { 
  businessRegister, 
  customerRegister,
};