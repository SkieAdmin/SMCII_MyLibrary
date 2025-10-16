import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import prisma from '../config/db.js';
import { generateToken } from '../utils/tokenUtils.js';

const ALLOWED_ROLES = ['admin', 'librarian', 'staff', 'member'];

const sanitizeUser = ({ password, ...user }) => user;

export const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors: errors.array() },
    });
  }

  const {
    fullName,
    role,
    email,
    password,
    confirmPassword,
    phoneNumber,
    idNumber,
  } = req.body;

  const normalizedRole =
    typeof role === 'string' ? role.trim().toLowerCase() : '';

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`,
      data: null,
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
      data: null,
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        fullName,
        role: normalizedRole,
        email,
        password: hashedPassword,
        phoneNumber,
        idNumber,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: sanitizeUser(createdUser) },
    });
  } catch (error) {
    const err = new Error('Failed to register user');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};

export const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors: errors.array() },
    });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: null,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        data: null,
      });
    }

    const token = generateToken({ id: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    const err = new Error('Failed to login user');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};
