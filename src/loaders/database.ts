import mongoose from 'mongoose';
import config from '../app/config/app';

const initializeDatabase = async () => {
  // Fix mongoose strictQuery deprecation warning
  mongoose.set('strictQuery', false);
  
  // Set other mongoose options to suppress warnings
  mongoose.set('strictPopulate', false);
  const connection = await mongoose
    .connect(config.dbConnection)
    .catch((e: any) => {
      // eslint-disable-next-line no-console
      console.error('mongodb error', e);
      process.exit(1);
    });

  return connection.connection.db;
};

export default initializeDatabase;
