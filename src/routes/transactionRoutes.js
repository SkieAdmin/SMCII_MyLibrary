import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  borrowBook,
  reserveBook,
  returnBook,
  getUserTransactions,
} from '../controllers/transactionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post(
  '/borrow',
  [
    body('userId')
      .isInt({ min: 1 })
      .withMessage('Valid userId is required')
      .toInt(),
    body('bookId')
      .isInt({ min: 1 })
      .withMessage('Valid bookId is required')
      .toInt(),
  ],
  borrowBook,
);

router.post(
  '/reserve',
  [
    body('userId')
      .isInt({ min: 1 })
      .withMessage('Valid userId is required')
      .toInt(),
    body('bookId')
      .isInt({ min: 1 })
      .withMessage('Valid bookId is required')
      .toInt(),
  ],
  reserveBook,
);

router.post(
  '/return',
  [
    body('userId')
      .isInt({ min: 1 })
      .withMessage('Valid userId is required')
      .toInt(),
    body('bookId')
      .isInt({ min: 1 })
      .withMessage('Valid bookId is required')
      .toInt(),
  ],
  returnBook,
);

router.get(
  '/mybooks/:userId',
  [
    param('userId')
      .isInt({ min: 1 })
      .withMessage('Valid userId is required')
      .toInt(),
  ],
  getUserTransactions,
);

export default router;
