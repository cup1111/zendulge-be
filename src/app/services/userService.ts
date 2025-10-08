import User from '../model/user';

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
    throw new Error('Invalid activation code');
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