const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create email transporter
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration incomplete. Email functionality disabled.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  transporter.verify((error) => {
    if (error) {
      console.error('Email transporter verification failed:', error);
    } else {
      console.log('Email transporter ready');
    }
  });

  return transporter;
};

// Send email
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    });

    console.log(`Email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Generate email verification token
const generateEmailVerificationToken = () => crypto.randomBytes(32).toString('hex');

// Send verification email
const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  const message = `
    <h2>Email Verification</h2>
    <p>Hello ${user.name},</p>
    <p>Please click below to verify your email:</p>
    <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;background-color:#10B981;color:white;text-decoration:none;border-radius:5px;">Verify Email</a>
  `;
  return await sendEmail(user.email, 'Verify Your Email', message);
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, admissionNo, departmentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    if (role !== 'student') {
      return res.status(400).json({ message: 'Only student registration is allowed' });
    }

    if (!admissionNo || !departmentId) {
      return res.status(400).json({ message: 'Admission number and department are required for students' });
    }

    const emailVerificationToken = generateEmailVerificationToken();
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      emailVerificationToken,
      emailVerified: false
    });

    await user.save();

    if (role === 'student') {
      const Student = require('../models/Student');
      const studentRecord = new Student({
        userId: user._id,
        admissionNo: admissionNo.toUpperCase(),
        departmentId,
        year: 1,
        courses: [],
        fees: []
      });
      await studentRecord.save();
    }

    const emailSent = await sendVerificationEmail(user, emailVerificationToken);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

    res.status(201).json({
      message: emailSent
        ? 'Account created. Check your email to verify your account.'
        : 'Account created but verification email failed.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
      requiresVerification: !emailSent
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) return res.status(400).json({ message: 'Email or admission number already exists' });
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    if (!user.isActive) return res.status(400).json({ message: 'Account deactivated' });
    if (!user.emailVerified) return res.status(400).json({ message: 'Email not verified' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, profilePic: req.user.profilePic } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
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
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `<h2>Password Reset</h2><p>Hello ${user.name}, click <a href="${resetUrl}">here</a> to reset your password.</p>`;

    const transporter = createTransporter();
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to: user.email, subject: 'Password Reset', html: message });

    res.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Reset Token
router.get('/reset-password/verify/:token', async (req, res) => {
  try {
    const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: resetTokenHash, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });
    res.json({ message: 'Reset token valid', valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Server error during token verification' });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: resetTokenHash, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

    res.json({ message: 'Password reset successful', token: jwtToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change Password (logged-in user)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password incorrect' });

    req.user.password = newPassword;
    await req.user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: tokenHash, emailVerified: false });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });

    const newVerificationToken = generateEmailVerificationToken();
    user.emailVerificationToken = newVerificationToken;
    await user.save();

    const emailSent = await sendVerificationEmail(user, newVerificationToken);
    if (emailSent) res.json({ message: 'Verification email sent successfully' });
    else res.status(500).json({ message: 'Failed to send verification email' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
