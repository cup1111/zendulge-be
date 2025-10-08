import companyService from './companyService';
import userService from './userService';
import emailService from './emailService';

export interface IBusinessOwnerRegistration {
  // User data
  email: string;
  password: string;
  name: string;
  jobTitle?: string;
  
  // Company data
  companyName: string;
  companyDescription?: string;
  companyWebsite?: string;
}

export interface IClientRegistration {
  email: string;
  password: string;
  name: string;
  jobTitle?: string;
}

export const businessOwnerRegister = async (registrationData: IBusinessOwnerRegistration) => {
  const { 
    email, 
    password, 
    name, 
    jobTitle,
    companyName,
    companyDescription,
    companyWebsite,
  } = registrationData;

  // Prepare user data
  const userData = {
    email,
    password,
    name,
    jobTitle,
    active: false, // Will be activated after email verification
  };

  // Create the user
  const user = await userService.store(userData);

  // Prepare company data
  const companyData = {
    name: companyName,
    description: companyDescription,
    website: companyWebsite,
    owner: user._id,
    isActive: true,
  };

  // Create the company
  const company = await companyService.store(companyData);

  // Generate activation code/token for email verification
  const activationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
  // Update user with activation code
  await userService.updateActivationCode(user._id.toString(), activationCode);

  // Send verification email
  await emailService.sendVerificationEmail(user.email, activationCode);

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


export const clientRegister = async (registrationData: IClientRegistration) => {
  try {
    const { email, password, name, jobTitle } = registrationData;

    const userData = {
      email,
      password,
      name,
      jobTitle,
      active: false,
    };

    const user = await userService.store(userData);

    // Generate activation code
    const activationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await userService.updateActivationCode(user._id.toString(), activationCode);

    // Send verification email
    await emailService.sendVerificationEmail(user.email, activationCode);

    return {
      success: true,
      message: 'Client registered successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Client registration failed: ${errorMessage}`);
  }
};

export default { 
  businessOwnerRegister, 
  clientRegister,
};