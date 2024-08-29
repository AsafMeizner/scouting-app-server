// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '../../../utils/users';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    const user = await authenticate(username, password);

    if (user && user.role === 'admin') {
      res.status(200).json({ role: user.role });
    } else {
      res.status(401).json({ message: 'Invalid credentials or insufficient permissions' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
