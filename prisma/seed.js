import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const seedUsers = async () => {
  const password = await bcrypt.hash('Password123!', 10);

  const users = [
    {
      fullName: 'Admin User',
      role: 'admin',
      email: 'admin@smcii.mylib',
      password,
      phoneNumber: '1234567890',
      idNumber: 'ADM001',
    },
    {
      fullName: 'Librarian Jane',
      role: 'librarian',
      email: 'jane@smcii.mylib',
      password,
      phoneNumber: '0987654321',
      idNumber: 'LIB002',
    },
  ];

  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      }),
    ),
  );
};

const seedBooks = async () => {
  const books = [
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      ISBN: '9780132350884',
      category: 'Software Engineering',
      totalCopies: 5,
      availableCopies: 5,
    },
    {
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt',
      ISBN: '9780201616224',
      category: 'Programming',
      totalCopies: 3,
      availableCopies: 3,
    },
  ];

  await Promise.all(
    books.map((book) =>
      prisma.book.upsert({
        where: { ISBN: book.ISBN },
        update: {},
        create: book,
      }),
    ),
  );
};

const main = async () => {
  await seedUsers();
  await seedBooks();
  console.log('Database seeded successfully');
};

main()
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
