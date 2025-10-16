import { validationResult } from 'express-validator';
import prisma from '../config/db.js';

const sanitizeUser = ({ password, ...user }) => user;

export const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors: errors.array() },
    });
  }

  const { id } = req.params;
  const { fullName, email, phoneNumber, idNumber } = req.body;

  // Ensure user can only update their own profile (unless admin)
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own profile',
      data: null,
    });
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken by another user',
          data: null,
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(phoneNumber !== undefined && { phoneNumber: phoneNumber || null }),
        ...(idNumber !== undefined && { idNumber: idNumber || null }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    const err = new Error('Failed to update user profile');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};

export const getUser = async (req, res, next) => {
  const { id } = req.params;

  // Ensure user can only view their own profile (unless admin)
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own profile',
      data: null,
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: sanitizeUser(user),
    });
  } catch (error) {
    const err = new Error('Failed to retrieve user');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};
