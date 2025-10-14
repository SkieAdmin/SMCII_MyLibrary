import { Router } from 'express';
import { body } from 'express-validator';
import {
  addBook,
  getBooks,
  updateBook,
  deleteBook,
} from '../controllers/bookController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.post(
  '/add',
  authorizeRoles('admin', 'librarian', 'staff'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('ISBN').trim().notEmpty().withMessage('ISBN is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('totalCopies')
      .isInt({ min: 0 })
      .withMessage('Total copies must be a non-negative integer')
      .toInt(),
    body('availableCopies')
      .isInt({ min: 0 })
      .withMessage('Available copies must be a non-negative integer')
      .toInt(),
  ],
  addBook,
);

router.get('/', getBooks);

router.put(
  '/edit/:id',
  authorizeRoles('admin', 'librarian', 'staff'),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
    body('ISBN').optional().trim().notEmpty().withMessage('ISBN cannot be empty'),
    body('category')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Category cannot be empty'),
    body('totalCopies')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Total copies must be a non-negative integer')
      .toInt(),
    body('availableCopies')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Available copies must be a non-negative integer')
      .toInt(),
  ],
  updateBook,
);

router.delete(
  '/delete/:id',
  authorizeRoles('admin'),
  deleteBook,
);

export default router;
