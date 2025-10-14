import 'dotenv/config';
import express from 'express';
import prisma from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import bookRoutes from './src/routes/bookRoutes.js';
import transactionRoutes from './src/routes/transactionRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import { notFound, errorHandler } from './src/middleware/errorMiddleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) =>
  res.status(200).json({
    success: true,
    message: 'SMCII MyLib API is healthy',
    data: null,
  }),
);

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Support legacy/non-prefixed mobile clients while migrating to /api namespace.
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/transactions', transactionRoutes);
app.use('/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`Received ${signal}. Closing server gracefully...`);
      server.close(async (err) => {
        if (err) {
          console.error('Error shutting down server', err);
          process.exit(1);
        }

        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
