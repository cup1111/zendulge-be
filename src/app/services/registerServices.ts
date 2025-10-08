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
  companyIndustry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  companyLocation?: string;
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
    companyIndustry,
    companySize,
    companyLocation,
  } = registrationData;

  try {
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
      industry: companyIndustry,
      size: companySize,
      location: companyLocation,
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

  } catch (error) {
    // If company creation fails, we might want to clean up the user
    // This depends on your business logic and error handling strategy
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Registration failed: ${errorMessage}`);
  }
};


export default {  register: businessOwnerRegister  };