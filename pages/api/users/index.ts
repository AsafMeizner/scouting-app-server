// pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { withAuth } from '../../../utils/middleware';
import { User } from '../../../utils/users';

const url = process.env.DATABASE_URL || 'your-mongodb-url';
const client = new MongoClient(url);
const dbName = 'test';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      await client.connect();
      const db = client.db(dbName);
      const users = await db.collection<User>('users').find().toArray();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
    } finally {
      await client.close();
    }
  } else if (req.method === 'POST') {
    const { username, password, permissions } = req.body;

    if (!username || !password || !permissions) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      await client.connect();
      const db = client.db(dbName);
      const newUser: User = {
        username,
        password,
        permissions: permissions,
      };

      await db.collection<User>('users').insertOne(newUser);
      res.status(201).json({ message: 'User created' });
    } catch (error) {
      res.status(500).json({ message: 'Error creating user' });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}, 'users', 'read');
