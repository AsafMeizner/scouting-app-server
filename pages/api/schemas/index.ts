// pages/api/schemas/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { withAuth } from '../../../utils/middleware';
import { User } from '../../../utils/users';

const url = process.env.DATABASE_URL || 'your-mongodb-url';
const client = new MongoClient(url);
const dbName = 'test';

type ResponseData = {
  message: string;
  schemas?: any[];
  schemaId?: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>, user: User) {
  if (req.method === 'GET') {
    try {
      await client.connect();
      const db = client.db(dbName);
      const schemas = await db.collection('schemas').find().toArray();
      res.status(200).json({ message: 'Schemas fetched successfully', schemas });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching schemas' });
    } finally {
      await client.close();
    }
  } else if (req.method === 'POST') {
    // Ensure the user has 'write' permission for the 'schemas' collection
    if (!user.permissions.collections.some(c => c.name === 'schemas' && c.write)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    try {
      await client.connect();
      const db = client.db(dbName);
      const { name, schema } = req.body;
      const result = await db.collection('schemas').insertOne({
        name,
        schema,
        createdAt: new Date(),
      });
      res.status(201).json({ message: 'Schema created', schemaId: result.insertedId.toString() });
    } catch (error) {
      res.status(500).json({ message: 'Error creating schema' });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default withAuth(handler, 'schemas', 'read'); // Ensure 'read' permission for GET, 'write' for POST
