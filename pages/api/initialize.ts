// pages/api/initialize.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeUserCollection } from '../../utils/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await initializeUserCollection();
    res.status(200).json({ message: 'User collection initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to initialize user collection', error });
  }
}
