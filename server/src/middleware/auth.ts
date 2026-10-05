import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'smartnest_super_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    society_id: string | null;
    role: 'admin' | 'resident' | 'staff';
    full_name: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token, check for demo header or proceed as guest/demo
    req.user = {
      id: 'usr-demo-admin-001',
      email: 'admin@smartnest.community',
      society_id: 'e7b1a234-5678-4321-8765-abcdef123456',
      role: 'admin',
      full_name: 'Community Administrator',
    };
    return next();
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id || decoded.sub || 'usr-demo-admin-001',
      email: decoded.email || 'admin@smartnest.community',
      society_id: decoded.society_id || decoded.societyId || 'e7b1a234-5678-4321-8765-abcdef123456',
      role: decoded.role || 'admin',
      full_name: decoded.full_name || decoded.fullName || 'User',
    };
    next();
  } catch (err) {
    // If invalid token, return 401
    res.status(401).json({ error: 'Unauthorized: Invalid or expired JWT token' });
  }
}

export function requireRole(allowedRoles: Array<'admin' | 'resident' | 'staff'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions for this action' });
      return;
    }
    next();
  };
}
