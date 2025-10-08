import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Fix mongoose deprecation warnings
mongoose.set('strictQuery', false);

let mongod;
let dbConnection;

/**
 * Connect to the in-memory database.
 */
const connect = async () => {

  // Start both database services in parallel
  mongod = new MongoMemoryServer();

  await mongod.start();
  // Get the URIs
  const uri = mongod.getUri();
  // Connect to the main database using the default mongoose connection
  dbConnection = await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return {  dbConnection };
};

/**
 * Drop database, close the connection and stop mongod.
 */
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
};

/**
 * Remove all the data for all db collections.
 */
const clearDatabase = async () => {
  const mainCollections = await mongoose.connection.db.collections();
  for (const collection of mainCollections) {
    await collection.deleteMany({});
  }
};

export default { connect, closeDatabase, clearDatabase };
