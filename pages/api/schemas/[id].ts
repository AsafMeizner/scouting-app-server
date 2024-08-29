// pages/api/schemas/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, ObjectId } from 'mongodb';
import { withAuth } from '../../../utils/middleware';
import { User } from '../../../utils/users';

const url = process.env.DATABASE_URL || 'your-mongodb-url';
const client = new MongoClient(url);
const dbName = 'test';

type ResponseData = {
  message: string;
  schema?: any;
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>, user: User) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      await client.connect();
      const db = client.db(dbName);
      const schema = await db.collection('schemas').findOne({ _id: new ObjectId(id as string) });
      if (schema) {
        res.status(200).json({ message: 'Schema fetched successfully', schema });
      } else {
        res.status(404).json({ message: 'Schema not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error fetching schema' });
    } finally {
      await client.close();
    }
  } else if (req.method === 'PUT') {
    // Ensure the user has 'write' permission for the 'schemas' collection
    if (!user.permissions.collections.some(c => c.name === 'schemas' && c.write)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const { schema } = req.body;
    try {
      await client.connect();
      const db = client.db(dbName);
      const result = await db.collection('schemas').updateOne(
        { _id: new ObjectId(id as string) },
        { $set: { schema, createdAt: new Date() } }
      );
      if (result.modifiedCount > 0) {
        res.status(200).json({ message: 'Schema updated successfully' });
      } else {
        res.status(404).json({ message: 'Schema not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating schema' });
    } finally {
      await client.close();
    }
  } else if (req.method === 'DELETE') {
    // Ensure the user has 'write' permission for the 'schemas' collection
    if (!user.permissions.collections.some(c => c.name === 'schemas' && c.write)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    try {
      await client.connect();
      const db = client.db(dbName);
      const result = await db.collection('schemas').deleteOne({ _id: new ObjectId(id as string) });
      if (result.deletedCount > 0) {
        res.status(200).json({ message: 'Schema deleted successfully' });
      } else {
        res.status(404).json({ message: 'Schema not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting schema' });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default withAuth(handler, 'schemas', 'read'); // Ensure 'read' permission for GET, 'write' for PUT/DELETE
