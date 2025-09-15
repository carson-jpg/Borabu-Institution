const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env' });

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using a default value for development. This should be set to a secure random string in production.');
  process.env.JWT_SECRET = 'dev-jwt-secret-key-change-this-in-production';
}

const app = express();

// Middleware
app.use(cors({
  origin: ["https://borabu-institution.vercel.app", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/transcripts', require('./routes/transcripts'));
app.use('/api/timetables', require('./routes/timetables'));
app.use('/api/reports', require('./routes/reports'));

// Connect to MongoDB with better error handling and retry options
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('MONGODB_URI environment variable is not set!');
  console.log('Please set the MONGODB_URI in your .env file with a valid MongoDB connection string');
  console.log('Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB with URI:', mongoURI);

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Please check your MongoDB connection string in the .env file');
  console.log('Current MONGODB_URI environment variable:', process.env.MONGODB_URI);
  console.log('If using MongoDB Atlas, ensure your IP is whitelisted and credentials are correct');
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'School Portal API is running!' });
});

// Error handling middleware
/**
 * @param {any} err
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
