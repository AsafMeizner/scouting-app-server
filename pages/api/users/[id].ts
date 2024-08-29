// pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, ObjectId } from 'mongodb';
import { withAuth } from '../../../utils/middleware';
import { User } from '../../../utils/users';

const url = process.env.DATABASE_URL || 'your-mongodb-url';
const client = new MongoClient(url);
const dbName = 'test';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await client.connect();
      const db = client.db(dbName);
      const result = await db.collection<User>('users').deleteOne({ _id: new ObjectId(id as string) });

      if (result.deletedCount > 0) {
        res.status(200).json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user' });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}, 'users', 'write');
