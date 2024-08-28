// middleware.ts - Place this in a utils folder or similar
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticate, User, UserRole } from './users';

export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: User) => Promise<void>,
  requiredRole: UserRole | null = null
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { username, password } = req.headers;

    if (!username || !password) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = authenticate(username as string, password as string);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    return handler(req, res, user);
  };
}
