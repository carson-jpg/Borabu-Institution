const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get fee records
router.get('/', auth, async (req, res) => {
  try {
    const { studentId, status } = req.query;
    let filter = { isActive: true };

    if (studentId) filter._id = studentId;

    // If user is a student, only show their fees
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        filter._id = student._id;
      }
    }

    const students = await Student.find(filter)
      .populate('userId', 'name email')
      .populate('departmentId', 'name')
      .select('userId admissionNo departmentId fees');

    let feeRecords = [];
    students.forEach(student => {
      student.fees.forEach(fee => {
        if (!status || fee.status === status) {
          feeRecords.push({
            _id: fee._id,
            student: {
              _id: student._id,
              userId: student.userId,
              admissionNo: student.admissionNo,
              departmentId: student.departmentId
            },
            amount: fee.amount,
            status: fee.status,
            dueDate: fee.dueDate,
            description: fee.description,
            paidDate: fee.paidDate
          });
        }
      });
    });

    res.json(feeRecords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get fee summary for a student
router.get('/summary/:studentId', auth, async (req, res) => {
  try {
    // Validate student ID format
    if (!req.params.studentId || !mongoose.Types.ObjectId.isValid(req.params.studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const student = await Student.findById(req.params.studentId)
      .populate('userId', 'name email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && student.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalFees = student.fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidFees = student.fees
      .filter(fee => fee.status === 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0);
    const pendingFees = student.fees
      .filter(fee => fee.status === 'pending')
      .reduce((sum, fee) => sum + fee.amount, 0);
    const overdueFees = student.fees
      .filter(fee => fee.status === 'overdue')
      .reduce((sum, fee) => sum + fee.amount, 0);

    const summary = {
      studentId: student._id,
      studentName: student.userId.name,
      admissionNo: student.admissionNo,
      totalFees,
      paidFees,
      pendingFees,
      overdueFees,
      balance: totalFees - paidFees,
      helbLoan: student.helbLoan,
      fees: student.fees
    };

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record payment (Admin only)
router.post('/payment', auth, authorize('admin'), async (req, res) => {
  try {
    const { studentId, feeId, amount, paymentDate } = req.body;

    // Validate required fields
    if (!studentId || !feeId) {
      return res.status(400).json({ message: 'Student ID and Fee ID are required' });
    }

    // Validate student ID format
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const fee = student.fees.id(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    fee.status = 'paid';
    fee.paidDate = paymentDate || new Date();

    await student.save();

    res.json({ message: 'Payment recorded successfully', fee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student payment endpoint (Students can pay their own fees)
router.post('/student-payment', auth, async (req, res) => {
  try {
    const { feeId, amount, paymentMethod } = req.body;

    // Find student by user ID
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const fee = student.fees.id(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (fee.status === 'paid') {
      return res.status(400).json({ message: 'Fee is already paid' });
    }

    // For now, we'll mark as paid. In a real implementation, you'd integrate with a payment gateway
    fee.status = 'paid';
    fee.paidDate = new Date();

    await student.save();

    res.json({
      message: 'Payment processed successfully',
      fee,
      paymentMethod,
      amount: fee.amount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate fee statement (Admin and Students)
router.get('/statement/:studentId', auth, async (req, res) => {
  try {
    // Validate student ID format
    if (!req.params.studentId || !mongoose.Types.ObjectId.isValid(req.params.studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const student = await Student.findById(req.params.studentId)
      .populate('userId', 'name email')
      .populate('departmentId', 'name');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && student.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const statement = {
      student: {
        name: student.userId.name,
        email: student.userId.email,
        admissionNo: student.admissionNo,
        department: student.departmentId.name
      },
      fees: student.fees.map(fee => ({
        description: fee.description,
        amount: fee.amount,
        dueDate: fee.dueDate,
        status: fee.status,
        paidDate: fee.paidDate
      })),
      summary: {
        totalFees: student.fees.reduce((sum, fee) => sum + fee.amount, 0),
        totalPaid: student.fees
          .filter(fee => fee.status === 'paid')
          .reduce((sum, fee) => sum + fee.amount, 0),
        balance: student.fees.reduce((sum, fee) => {
          return fee.status === 'paid' ? sum : sum + fee.amount;
        }, 0)
      },
      generatedAt: new Date()
    };

    res.json(statement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;