import { verifyToken } from '../utils/tokenUtils.js';
import prisma from '../config/db.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header missing or malformed',
      data: null,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User associated with token no longer exists',
        data: null,
      });
    }

    const { password, ...safeUser } = user;
    const role =
      typeof safeUser.role === 'string' ? safeUser.role.trim().toLowerCase() : '';
    req.user = { ...safeUser, role };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      data: null,
    });
  }
};

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User is not authenticated',
      data: null,
    });
  }

  const normalizedRole =
    typeof req.user.role === 'string' ? req.user.role.toLowerCase() : '';
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

  if (!normalizedAllowedRoles.includes(normalizedRole)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action',
      data: null,
    });
  }

  return next();
};
