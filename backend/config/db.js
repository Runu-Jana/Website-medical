import prisma from '../prisma/client.js';

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');
  } catch (err) {
    console.error(`❌ Database connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
