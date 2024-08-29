// pages/api/entries/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { withAuth } from '../../../utils/middleware';
import { User } from '../../../utils/users';

const url = process.env.DATABASE_URL || 'your-mongodb-url';
const client = new MongoClient(url);
const dbName = 'your-database-name';

type ResponseData = {
  message: string;
  entries?: any[];
  entryId?: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>, user: User) {
  if (req.method === 'GET') {
    try {
      await client.connect();
      const db = client.db(dbName);
      const entries = await db.collection('entries').find().toArray();
      res.status(200).json({ message: 'Entries fetched successfully', entries });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching entries' });
    } finally {
      await client.close();
    }
  } else if (req.method === 'POST') {
    try {
      await client.connect();
      const db = client.db(dbName);
      const { data } = req.body;
      const result = await db.collection('entries').insertOne({
        timestamp: new Date(),
        data,
      });
      res.status(201).json({ message: 'Entry created', entryId: result.insertedId.toString() });
    } catch (error) {
      res.status(500).json({ message: 'Error creating entry' });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default withAuth(handler, 'entries', 'read'); // Adjust 'read' to 'write' for POST
