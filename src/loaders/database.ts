import mongoose from 'mongoose';
import config from '../app/config/app';

const initializeDatabase = async () => {
  // Fix mongoose strictQuery deprecation warning
  mongoose.set('strictQuery', false);

  // Set other mongoose options to suppress warnings
  mongoose.set('strictPopulate', false);

  // Global transformation: Convert _id to id and remove __v
  mongoose.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

  mongoose.set('toObject', {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });

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
