import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import app from './app';
const db = process.env.DATABASE_LOCAL;
const port = process.env.PORT || 3000;

// Connect to database
try {
  mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected successfully to DB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected');
  });
  await mongoose.connect(db as string);

  console.log('Database connection successful');
} catch (err) {
  console.log(`Couldn't connect to database`);
  process.exit(1);
}

const server = app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDEKED REJECTION 💥💥 Shutting down the server...');
  console.log(err.name, err.message);
  // Just in case the connection get stuck
  setTimeout(() => {
    process.exit(1);
  }, 10000);
  server.close(() => {
    process.exit(1);
  });
});
