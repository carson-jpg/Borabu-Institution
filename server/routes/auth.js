const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Enhanced email transporter configuration with better error handling
const createTransporter = () => {
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email configuration is incomplete. Email functionality will be disabled.');
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

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email transporter is ready to send messages');
      }
    });

    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

// Helper function to send email with better error handling
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.error('Cannot send email: Email transporter not configured');
      return false;
    }

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

// Helper function to generate email verification token (RAW token)
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to send verification email
const sendVerificationEmail = async (user, rawToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;

  const message = `
    <h2>Email Verification</h2>
    <p>Hello ${user.name},</p>
    <p>Thank you for registering with Borabu Technical Training Institute!</p>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    <p>If you did not create this account, please ignore this email.</p>
    <br>
    <p>Best regards,<br>Borabu Technical Training Institute</p>
  `;

  return await sendEmail(
    user.email,
    'Verify Your Email - Borabu Technical Training Institute',
    message
  );
};

const bcrypt = require('bcryptjs'); // <--- ADD THIS at the top

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
      return res.status(400).json({
        message: 'Only student registration is allowed. Admin and teacher accounts are pre-registered by administrators.'
      });
    }

    if (!admissionNo || !departmentId) {
      return res.status(400).json({ message: 'Admission number and department are required for students' });
    }

    const rawVerificationToken = generateEmailVerificationToken();
    const verificationTokenHash = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,   // Let the User model pre-save hook handle hashing
      role,
      emailVerificationToken: verificationTokenHash,
      emailVerified: false
    });

    await user.save();

    // Create student record
    const Student = require('../models/Student');
    await new Student({
      userId: user._id,
      admissionNo: admissionNo.toUpperCase(),
      departmentId,
      year: 1,
      courses: [],
      fees: []
    }).save();

    await sendVerificationEmail(user, rawVerificationToken);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Log login attempt for debugging
    console.log('Login attempt:', { email, normalizedEmail: email?.toLowerCase?.() });

    // Validation
    if (!email || !password) {
      console.log('Login failed: Email or password missing');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists - include password field for comparison and verification status
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    console.log('User found:', user ? { id: user._id, email: user.email, emailVerified: user.emailVerified, isActive: user.isActive } : 'not found');

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.isActive === false) {
      console.log('Login failed: Account deactivated');
      return res.status(400).json({ message: 'Account has been deactivated. Please contact administrator.' });
    }

    // Require verified email
    if (!user.emailVerified) {
      console.log('Login failed: Email not verified');
      return res.status(400).json({ message: 'Email not verified. Please check your inbox for the verification email.' });
    }

    // Check password using model method
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log('Login successful for user:', user.email);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profilePic: req.user.profilePic
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiration (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const message = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.name},</p>
      <p>You have requested to reset your password for your Borabu Technical Training Institute account.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
      <br>
      <p>Best regards,<br>Borabu Technical Training Institute</p>
    `;

    // Send email
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset Request - Borabu Technical Training Institute',
        html: message
      });

      res.json({ message: 'Password reset email sent successfully' });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Reset the token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(500).json({ message: 'Error sending email. Please try again later.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Reset Token
router.get('/reset-password/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Reset token is valid', valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Server error during token verification' });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password (assumes pre-save hook hashes when modified)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate new JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Password reset successful',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change Password (for logged-in users)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password (assumes pre-save hook hashes when modified)
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (optional - mainly for clearing server-side sessions if implemented)
router.post('/logout', auth, async (req, res) => {
  try {
    // In JWT implementation, logout is mainly handled client-side by removing the token
    // But we can add server-side token blacklisting if needed in the future
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerified: false
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update email verification status
    user.emailVerified = true;
    user.emailVerificationToken = undefined; // Clear the token after verification
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

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // --- FIX: generate RAW, store HASH ---
    const newRawToken = generateEmailVerificationToken();
    const newTokenHash = crypto.createHash('sha256').update(newRawToken).digest('hex');
    user.emailVerificationToken = newTokenHash; // store HASH
    await user.save();

    // Send verification email with RAW token
    const emailSent = await sendVerificationEmail(user, newRawToken);

    if (emailSent) {
      res.json({ message: 'Verification email sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
