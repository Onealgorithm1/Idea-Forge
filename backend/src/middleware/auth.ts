import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
  tenantId?: string;
}

export const extractTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (tenantId) {
    req.tenantId = tenantId;
  }
  next();
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    // Extract tenant_id from token payload or fallback to X-Tenant-ID header
    req.tenantId = user.tenantId || (req.headers['x-tenant-id'] as string);
    next();
  });
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin role required' });
  }
};

export const isAdminOrReviewer = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && ['admin', 'reviewer'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin or Reviewer role required' });
  }
};

export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.isSuperAdmin === true || ['superadmin', 'supportadmin'].includes(req.user.role))) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Super Admin role required' });
  }
};
