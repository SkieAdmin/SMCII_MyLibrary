import { validationResult } from 'express-validator';
import prisma from '../config/db.js';

const toNumber = (value) => Number.parseInt(value, 10);

export const borrowBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors: errors.array() },
    });
  }

  const { userId, bookId } = req.body;
  const numericUserId = toNumber(userId);
  const numericBookId = toNumber(bookId);

  try {
    const [user, book] = await Promise.all([
      prisma.user.findUnique({ where: { id: numericUserId } }),
      prisma.book.findUnique({ where: { id: numericBookId } }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        data: null,
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No available copies to borrow',
        data: null,
      });
    }

    const [updatedBook, transaction] = await prisma.$transaction([
      prisma.book.update({
        where: { id: numericBookId },
        data: { availableCopies: { decrement: 1 } },
      }),
      prisma.transaction.create({
        data: {
          userId: numericUserId,
          bookId: numericBookId,
          status: 'borrowed',
        },
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      data: { transaction, book: updatedBook },
    });
  } catch (error) {
    const err = new Error('Failed to borrow book');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};

export const reserveBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors: errors.array() },
    });
  }

  const { userId, bookId } = req.body;
  const numericUserId = toNumber(userId);
  const numericBookId = toNumber(bookId);

  try {
    const [user, book] = await Promise.all([
      prisma.user.findUnique({ where: { id: numericUserId } }),
      prisma.book.findUnique({ where: { id: numericBookId } }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        data: null,
      });
    }

    if (book.availableCopies > 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is currently available and cannot be reserved',
        data: null,
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: numericUserId,
        bookId: numericBookId,
        status: 'reserved',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Book reserved successfully',
      data: { transaction },
    });
  } catch (error) {
    const err = new Error('Failed to reserve book');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};

export const returnBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors: errors.array() },
    });
  }

  const { userId, bookId } = req.body;
  const numericUserId = toNumber(userId);
  const numericBookId = toNumber(bookId);

  try {
    const [transaction, book] = await Promise.all([
      prisma.transaction.findFirst({
        where: {
          userId: numericUserId,
          bookId: numericBookId,
          status: { in: ['borrowed', 'reserved'] },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.findUnique({ where: { id: numericBookId } }),
    ]);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        data: null,
      });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'No active transaction found for this book and user',
        data: null,
      });
    }

    if (book.availableCopies >= book.totalCopies) {
      return res.status(400).json({
        success: false,
        message: 'All copies are already returned',
        data: null,
      });
    }

    const [updatedTransaction, updatedBook] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'returned' },
      }),
      prisma.book.update({
        where: { id: numericBookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Book returned successfully',
      data: { transaction: updatedTransaction, book: updatedBook },
    });
  } catch (error) {
    const err = new Error('Failed to return book');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};

export const getUserTransactions = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors: errors.array() },
    });
  }

  const { userId } = req.params;
  const numericUserId = toNumber(userId);

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: numericUserId,
        status: { in: ['borrowed', 'reserved'] },
      },
      include: {
        book: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'User transactions fetched successfully',
      data: { transactions },
    });
  } catch (error) {
    const err = new Error('Failed to fetch user transactions');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};
