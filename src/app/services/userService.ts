import User from '../model/user';

const store = async (userData: any) => { 
  const user = new User(userData);
  return user.save();
};  

export default { store };