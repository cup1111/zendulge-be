import companyService from './companyService';
import userService from './userService';
import emailService from './emailService';
export const businessOwnerRegister = async () => {
  //create the user base on the user input
  const user = await userService.store(userData);

  //create the company base on the user input
  await companyService.store({ ...companyData, owner: user._id });

  //send the verification email
  await emailService.sendVerificationEmail(user.email, '');
};


export default {  register: businessOwnerRegister  };