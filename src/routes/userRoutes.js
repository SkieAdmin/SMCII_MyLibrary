import { Router } from 'express';
import { body } from 'express-validator';
import { updateUser, getUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/:id', getUser);

router.put(
  '/:id',
  [
    body('fullName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Full name cannot be empty'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required'),
    body('phoneNumber')
      .optional()
      .trim(),
    body('idNumber')
      .optional()
      .trim(),
  ],
  updateUser,
);

export default router;
