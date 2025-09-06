// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");

const router = express.Router();

// -------------------- REGISTER --------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, admissionNo, departmentId } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Only allow students to self-register
    if (role !== "student") {
      return res.status(400).json({
        message: "Only student registration is allowed. Admin/Teacher accounts are pre-registered by administrators."
      });
    }

    // Admission number & department are required for students
    if (!admissionNo || !departmentId) {
      return res.status(400).json({ message: "Admission number and department are required for students" });
    }

    // Create user (skip email verification for now)
    // Note: Password will be automatically hashed by the User model's pre-save hook
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Will be hashed by pre-save hook
      role,
      emailVerified: true // ✅ students can log in immediately
    });

    await user.save();

    // Create student record
    const studentRecord = new Student({
      userId: user._id,
      admissionNo: admissionNo.toUpperCase(),
      departmentId,
      year: 1,
      courses: [],
      fees: []
    });
    await studentRecord.save();

    // JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Student registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// -------------------- LOGIN --------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// -------------------- GET CURRENT USER --------------------
router.get("/current-user", require("../middleware/auth").auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
