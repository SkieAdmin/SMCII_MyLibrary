import prisma from '../config/db.js';

export const getDashboardMetrics = async (req, res, next) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const [totalBooks, borrowedBooks, reservedBooks, totalUsers, recentTransactions] =
      await Promise.all([
        prisma.book.count(),
        prisma.transaction.count({ where: { status: 'borrowed' } }),
        prisma.transaction.count({ where: { status: 'reserved' } }),
        prisma.user.count(),
        prisma.transaction.findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          distinct: ['userId'],
          select: { userId: true },
        }),
      ]);

    const activeMembers = recentTransactions.length;

    return res.status(200).json({
      success: true,
      message: 'Dashboard metrics fetched successfully',
      data: {
        totalBooks,
        borrowedBooks,
        reservedBooks,
        totalUsers,
        activeMembers,
      },
    });
  } catch (error) {
    const err = new Error('Failed to fetch dashboard metrics');
    err.statusCode = 500;
    err.cause = error;
    return next(err);
  }
};
