import jwt from 'jsonwebtoken';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }
  return secret;
};

export const generateToken = (payload, expiresIn = '7d') =>
  jwt.sign(payload, getSecret(), { expiresIn });

export const verifyToken = (token) => jwt.verify(token, getSecret());
