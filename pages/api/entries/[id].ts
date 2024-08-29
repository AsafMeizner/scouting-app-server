// pages/api/entries/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, ObjectId } from 'mongodb';
import { withAuth } from '../../../utils/middleware';
import { User } from '../../../utils/users';

const url = process.env.DATABASE_URL || 'your-mongodb-url';
const client = new MongoClient(url);
const dbName = 'test';

type ResponseData = {
  message: string;
  entry?: any;
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>, user: User) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      await client.connect();
      const db = client.db(dbName);
      const entry = await db.collection('entries').findOne({ _id: new ObjectId(id as string) });
      if (entry) {
        res.status(200).json({ message: 'Entry fetched successfully', entry });
      } else {
        res.status(404).json({ message: 'Entry not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error fetching entry' });
    } finally {
      await client.close();
    }
  } else if (req.method === 'PUT') {
    // Ensure the user has 'write' permission for the 'entries' collection
    if (!user.permissions.collections.some(c => c.name === 'entries' && c.write)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const { data } = req.body;
    try {
      await client.connect();
      const db = client.db(dbName);
      const result = await db.collection('entries').updateOne(
        { _id: new ObjectId(id as string) },
        { $set: { data, timestamp: new Date() } }
      );
      if (result.modifiedCount > 0) {
        res.status(200).json({ message: 'Entry updated successfully' });
      } else {
        res.status(404).json({ message: 'Entry not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating entry' });
    } finally {
      await client.close();
    }
  } else if (req.method === 'DELETE') {
    // Ensure the user has 'write' permission for the 'entries' collection
    if (!user.permissions.collections.some(c => c.name === 'entries' && c.write)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    try {
      await client.connect();
      const db = client.db(dbName);
      const result = await db.collection('entries').deleteOne({ _id: new ObjectId(id as string) });
      if (result.deletedCount > 0) {
        res.status(200).json({ message: 'Entry deleted successfully' });
      } else {
        res.status(404).json({ message: 'Entry not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting entry' });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default withAuth(handler, 'entries', 'read'); // Ensure 'read' permission for GET, 'write' for PUT/DELETE
