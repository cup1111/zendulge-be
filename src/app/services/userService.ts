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
  user.activeCode = '';
  return user.save();
};

const findByEmail = async (email: string) => {
  return User.findOne({ email: email.toLowerCase() });
};

export default {
  store,
  updateActivationCode,
  activateUser,
  findByEmail,
};
