const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Student = require('../models/Student');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Email transporter
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
  });
};

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;
    await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject, html });
    return true;
  } catch (err) {
    console.error('Email sending error:', err);
    return false;
  }
};

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, admissionNo, departmentId } = req.body;

    if (!name || !email || !password || !admissionNo || !departmentId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (role !== 'student') return res.status(400).json({ message: 'Only students can register' });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Create User
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      emailVerified: false
    });

    // Save user to hash password
    await user.save();

    // Create student record
    const student = new Student({
      userId: user._id,
      admissionNo: admissionNo.toUpperCase(),
      departmentId,
      year: 1,
      courses: [],
      fees: []
    });
    await student.save();

    // Email verification
    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    const emailHtml = `<p>Hello ${user.name},</p><p>Please verify your email:</p><a href="${verificationUrl}">Verify Email</a>`;
    await sendEmail(user.email, 'Verify Your Email', emailHtml);

    res.status(201).json({
      message: 'Account created. Check your email to verify',
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(400).json({ message: 'Email not verified' });
    }

    // Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Success response
    res.json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});


// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailHtml = `<p>Hello ${user.name},</p><p>Reset your password:</p><a href="${resetUrl}">Reset Password</a>`;
    await sendEmail(user.email, 'Password Reset', emailHtml);

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: resetTokenHash, resetPasswordExpires: { $gt: Date.now() } }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful', token: generateToken(user._id) });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Email verification
router.get('/verify-email/:token', async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: tokenHash, emailVerified: false });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
