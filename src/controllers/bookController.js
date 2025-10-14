import { validationResult } from 'express-validator';
import prisma from '../config/db.js';

export const addBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors: errors.array() },
    });
  }

  const {
    title,
    author,
    ISBN,
    category,
    totalCopies,
    availableCopies,
  } = req.body;

  if (availableCopies > totalCopies) {
    return res.status(400).json({
      success: false,
      message: 'Available copies cannot exceed total copies',
      data: null,
    });
  }

  try {
    const createdBook = await prisma.book.create({
      data: {
        title,
        author,
        ISBN,
        category,
        totalCopies,
        availableCopies,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: { book: createdBook },
    });
  } catch (error) {
    const err = new Error('Failed to add book');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};

export const getBooks = async (req, res, next) => {
  const { title, author, isbn, category } = req.query;

  const where = {};

  if (title) {
    where.title = { contains: title, mode: 'insensitive' };
  }

  if (author) {
    where.author = { contains: author, mode: 'insensitive' };
  }

  if (isbn) {
    where.ISBN = { contains: isbn, mode: 'insensitive' };
  }

  if (category) {
    where.category = { contains: category, mode: 'insensitive' };
  }

  try {
    const books = await prisma.book.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Books fetched successfully',
      data: { books },
    });
  } catch (error) {
    const err = new Error('Failed to fetch books');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};

export const updateBook = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      data: { errors: errors.array() },
    });
  }

  const { id } = req.params;
  const updateData = req.body;

  try {
    const existingBook = await prisma.book.findUnique({
      where: { id: Number(id) },
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        data: null,
      });
    }

    const nextTotalCopies =
      typeof updateData.totalCopies === 'number'
        ? updateData.totalCopies
        : existingBook.totalCopies;
    const nextAvailableCopies =
      typeof updateData.availableCopies === 'number'
        ? updateData.availableCopies
        : existingBook.availableCopies;

    if (nextAvailableCopies > nextTotalCopies) {
      return res.status(400).json({
        success: false,
        message: 'Available copies cannot exceed total copies',
        data: null,
      });
    }

    const updatedBook = await prisma.book.update({
      where: { id: existingBook.id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: { book: updatedBook },
    });
  } catch (error) {
    const err = new Error('Failed to update book');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};

export const deleteBook = async (req, res, next) => {
  const { id } = req.params;

  try {
    const existingBook = await prisma.book.findUnique({
      where: { id: Number(id) },
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        data: null,
      });
    }

    await prisma.book.delete({
      where: { id: existingBook.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: null,
    });
  } catch (error) {
    const err = new Error('Failed to delete book');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};
