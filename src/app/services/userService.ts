import User from '../model/user';
import {
  InvalidActivationTokenException,
  AccountAlreadyActivatedException,
} from '../exceptions';

const store = async (userData: any) => {
  const user = new User(userData);
  return user.save();
};

const updateActivationCode = async (userId: string, activationCode: string) => {
  return User.findByIdAndUpdate(
    userId,
    { activeCode: activationCode },
    { new: true },
  );
};

const activateUser = async (activationCode: string) => {
  const user = await User.findOne({ activeCode: activationCode });
  if (!user) {
    throw new InvalidActivationTokenException();
  }

  if (user.active) {
    throw new AccountAlreadyActivatedException();
  }

  user.active = true;
  return user.save();
};

const findByEmail = async (email: string) => {
  return User.findOne({ email: email.toLowerCase() });
};

const updateProfile = async (userId: string, updateData: any) => {
  // Only allow updating specific fields for security
  const allowedFields = {
    firstName: updateData.firstName,
    lastName: updateData.lastName,
    phoneNumber: updateData.phoneNumber,
    userName: updateData.userName,
  };

  // Remove undefined values
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([, value]) => value !== undefined),
  );

  const user = await User.findByIdAndUpdate(
    userId,
    filteredData,
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export default {
  store,
  updateActivationCode,
  activateUser,
  findByEmail,
  updateProfile,
};
