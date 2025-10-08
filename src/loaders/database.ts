import mongoose from 'mongoose';

const initializeDatabase = () => {
  // Fix mongoose strictQuery deprecation warning
  mongoose.set('strictQuery', false);
  
  // Set other mongoose options to suppress warnings
  mongoose.set('strictPopulate', false);
};

export default initializeDatabase;
