import { MongoClient, ObjectId } from 'mongodb';

const url = process.env.DATABASE_URL || 'your-mongodb-url';
const client = new MongoClient(url);
const dbName = 'test';
const collectionName = 'users';

export interface Permission {
  name: string;
  read: boolean;
  write: boolean;
}

export interface User {
  _id?: ObjectId;
  username: string;
  password: string;
  role: string;
  permissions: Permission[];
}

// Default admin user (only used for initialization)
const defaultAdmin: User = {
  username: 'admin',
  password: 'adminpass',
  role: 'admin',
  permissions: [
    { name: 'entries', read: true, write: true },
    { name: 'schemas', read: true, write: true },
    { name: 'users', read: true, write: true },
  ],
};

// Initialize the user collection with a default admin user if it doesn't exist
export async function initializeUserCollection() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const userCollection = db.collection<User>(collectionName);

    // Check if the collection is empty (no users)
    const adminExists = await userCollection.findOne({ username: 'admin' });

    if (!adminExists) {
      await userCollection.insertOne(defaultAdmin);
      console.log('Admin user created.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error initializing user collection:', error);
  } finally {
    await client.close();
  }
}

// Authenticate user by checking username and password
export async function authenticate(username: string, password: string): Promise<User | null> {
  try {
    await client.connect();
    const db = client.db(dbName);
    const userCollection = db.collection<User>(collectionName);

    const user = await userCollection.findOne({ username, password });
    return user || null;
  } catch (error) {
    console.error('Error during authentication:', error);
    return null;
  } finally {
    await client.close();
  }
}

// Add a new user
export async function addUser(newUser: User): Promise<ObjectId | null> {
  try {
    await client.connect();
    const db = client.db(dbName);
    const userCollection = db.collection<User>(collectionName);

    const result = await userCollection.insertOne(newUser);
    return result.insertedId;
  } catch (error) {
    console.error('Error adding new user:', error);
    return null;
  } finally {
    await client.close();
  }
}

// Check if a user has a specific permission for a given collection
export function hasPermission(user: User, collection: string, action: 'read' | 'write'): boolean {
  const permission = user.permissions.find(c => c.name === collection);
  return permission ? permission[action] : false;
}
