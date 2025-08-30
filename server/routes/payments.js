const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const mpesaService = require('../services/mpesaService');

const router = express.Router();

// Initiate M-Pesa payment
router.post('/mpesa/initiate', auth, async (req, res) => {
  try {
    const { feeId, phoneNumber, amount } = req.body;

    // Find student
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find the fee
    const fee = student.fees.id(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (fee.status === 'paid') {
      return res.status(400).json({ message: 'Fee is already paid' });
    }

    // Create payment record
    const payment = new Payment({
      studentId: student._id,
      feeId: feeId,
      amount: amount || fee.amount,
      phoneNumber: phoneNumber,
      paymentMethod: 'mpesa',
      status: 'pending'
    });

    await payment.save();

    // Format phone number for M-Pesa (ensure it starts with 254)
    let formattedPhone = phoneNumber.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    // Initiate STK push
    const stkResult = await mpesaService.initiateSTKPush(
      formattedPhone,
      payment.amount,
      `FEE-${student.admissionNo}`,
      `Fee payment for ${fee.description}`
    );

    if (stkResult.success) {
      // Update payment with transaction details
      payment.transactionId = stkResult.checkoutRequestId;
      payment.status = 'processing';
      await payment.save();

      res.json({
        success: true,
        message: 'Payment initiated successfully. Please check your phone to complete the transaction.',
        paymentId: payment._id,
        checkoutRequestId: stkResult.checkoutRequestId,
        customerMessage: stkResult.customerMessage
      });
    } else {
      // Update payment status to failed
      payment.status = 'failed';
      payment.failureReason = stkResult.error;
      await payment.save();

      res.status(400).json({
        success: false,
        message: 'Failed to initiate payment',
        error: stkResult.error
      });
    }

  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// M-Pesa callback handler
router.post('/mpesa/callback', async (req, res) => {
  try {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    // Validate callback
    if (!mpesaService.validateCallback(req.body)) {
      console.error('Invalid M-Pesa callback');
      return res.status(400).json({ message: 'Invalid callback' });
    }

    const callbackData = mpesaService.processCallback(req.body);

    // Find payment by checkout request ID
    const payment = await Payment.findOne({ transactionId: callbackData.checkoutRequestId });

    if (!payment) {
      console.error('Payment not found for checkout request ID:', callbackData.checkoutRequestId);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment based on callback result
    if (callbackData.resultCode === 0) {
      // Payment successful
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.mpesaReceiptNumber = callbackData.mpesaReceiptNumber;
      payment.mpesaTransactionId = callbackData.transactionId;
      payment.metadata = callbackData;

      // Update student fee status
      const student = await Student.findById(payment.studentId);
      if (student) {
        const fee = student.fees.id(payment.feeId);
        if (fee) {
          fee.status = 'paid';
          fee.paidDate = new Date();
          await student.save();
        }
      }
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = callbackData.resultDesc;
      payment.metadata = callbackData;
    }

    await payment.save();

    console.log('Payment updated:', payment._id, payment.status);

    res.json({ message: 'Callback processed successfully' });

  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Query payment status
router.get('/status/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('studentId', 'admissionNo userId')
      .populate('studentId.userId', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && payment.studentId.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      paymentId: payment._id,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      failureReason: payment.failureReason
    });

  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment history for a student
router.get('/history', auth, async (req, res) => {
  try {
    let studentId;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      studentId = student._id;
    } else {
      // For admin, require studentId parameter
      studentId = req.query.studentId;
      if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required for admin users' });
      }
    }

    const payments = await Payment.find({ studentId })
      .sort({ createdAt: -1 })
      .populate('studentId', 'admissionNo userId')
      .populate('studentId.userId', 'name email');

    res.json(payments.map(payment => ({
      _id: payment._id,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      failureReason: payment.failureReason
    })));

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all payments with filters
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, paymentMethod, startDate, endDate, page = 1, limit = 20 } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('studentId', 'admissionNo userId')
      .populate('studentId.userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      payments: payments.map(payment => ({
        _id: payment._id,
        student: {
          _id: payment.studentId._id,
          admissionNo: payment.studentId.admissionNo,
          name: payment.studentId.userId.name,
          email: payment.studentId.userId.email
        },
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        mpesaReceiptNumber: payment.mpesaReceiptNumber,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        failureReason: payment.failureReason
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get payment statistics
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount,
      completedAmount
    ] = await Promise.all([
      Payment.countDocuments(dateFilter),
      Payment.countDocuments({ ...dateFilter, status: 'completed' }),
      Payment.countDocuments({ ...dateFilter, status: 'pending' }),
      Payment.countDocuments({ ...dateFilter, status: 'failed' }),
      Payment.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { ...dateFilter, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      summary: {
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        successRate: totalPayments > 0 ? (completedPayments / totalPayments * 100).toFixed(2) : 0
      },
      amounts: {
        totalAmount: totalAmount[0]?.total || 0,
        completedAmount: completedAmount[0]?.total || 0,
        pendingAmount: totalAmount[0]?.total - (completedAmount[0]?.total || 0) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
