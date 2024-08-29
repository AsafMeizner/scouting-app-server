// utils/middleware.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate, hasPermission, User } from './users';

export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: User) => Promise<void>,
  collection: string,
  requiredAction: 'read' | 'write'
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authorization.split(' ')[1];
    const user = await authenticate(token, '');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!hasPermission(user, collection, requiredAction)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    return handler(req, res, user);
  };
}
