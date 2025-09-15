const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Department = require('../models/Department');
const Grade = require('../models/Grade');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Generate Student Performance Report
router.post('/student-performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    // Get all students with their grades
    const students = await Student.find()
      .populate('departmentId')
      .populate('userId');

    const grades = await Grade.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('studentId').populate('courseId');

    // Generate PDF
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Student Performance Report', 20, 20);

    // Date range
    doc.setFontSize(12);
    doc.text(`Period: ${startDate} to ${endDate}`, 20, 35);

    // Summary statistics
    const totalStudents = students.length;
    const totalGrades = grades.length;
    const averageGrade = grades.length > 0 ?
      grades.reduce((sum, grade) => sum + (grade.score || 0), 0) / grades.length : 0;

    doc.text(`Total Students: ${totalStudents}`, 20, 50);
    doc.text(`Total Grades Recorded: ${totalGrades}`, 20, 60);
    doc.text(`Average Grade: ${averageGrade.toFixed(2)}`, 20, 70);

    // Student performance table
    const tableData = students.map(student => {
      const studentGrades = grades.filter(g => g.studentId._id.toString() === student._id.toString());
      const avgGrade = studentGrades.length > 0 ?
        studentGrades.reduce((sum, g) => sum + (g.score || 0), 0) / studentGrades.length : 0;

      return [
        student.userId ? `${student.userId.firstName} ${student.userId.lastName}` : 'N/A',
        student.departmentId ? student.departmentId.name : 'N/A',
        studentGrades.length,
        avgGrade.toFixed(2)
      ];
    });

    doc.autoTable({
      head: [['Student Name', 'Department', 'Courses Taken', 'Average Grade']],
      body: tableData,
      startY: 80
    });

    // Convert to buffer and send
    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=student-performance-report.pdf');
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Error generating student performance report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Generate Attendance Summary Report
router.post('/attendance-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const attendance = await Attendance.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('studentId').populate('courseId');

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Attendance Summary Report', 20, 20);

    doc.setFontSize(12);
    doc.text(`Period: ${startDate} to ${endDate}`, 20, 35);

    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(2) : 0;

    doc.text(`Total Attendance Records: ${totalRecords}`, 20, 50);
    doc.text(`Present: ${presentCount}`, 20, 60);
    doc.text(`Absent: ${absentCount}`, 20, 70);
    doc.text(`Attendance Rate: ${attendanceRate}%`, 20, 80);

    // Attendance by course
    const courseAttendance = {};
    attendance.forEach(record => {
      const courseName = record.courseId ? record.courseId.name : 'Unknown';
      if (!courseAttendance[courseName]) {
        courseAttendance[courseName] = { total: 0, present: 0 };
      }
      courseAttendance[courseName].total++;
      if (record.status === 'present') {
        courseAttendance[courseName].present++;
      }
    });

    const courseData = Object.entries(courseAttendance).map(([course, data]) => [
      course,
      data.total,
      data.present,
      ((data.present / data.total) * 100).toFixed(2) + '%'
    ]);

    doc.autoTable({
      head: [['Course', 'Total Sessions', 'Present', 'Attendance Rate']],
      body: courseData,
      startY: 90
    });

    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-summary-report.pdf');
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Error generating attendance summary report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Generate Course Enrollment Report
router.post('/course-enrollment', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('departmentId')
      .populate('teacherId');

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Course Enrollment Report', 20, 20);

    const totalCourses = courses.length;
    doc.setFontSize(12);
    doc.text(`Total Courses: ${totalCourses}`, 20, 35);

    // Get enrollment data (this would need to be enhanced with actual enrollment data)
    const courseData = courses.map(course => [
      course.name,
      course.code,
      course.departmentId ? course.departmentId.name : 'N/A',
      course.teacherId ? `${course.teacherId.firstName} ${course.teacherId.lastName}` : 'Not Assigned',
      course.capacity || 'N/A'
    ]);

    doc.autoTable({
      head: [['Course Name', 'Course Code', 'Department', 'Teacher', 'Capacity']],
      body: courseData,
      startY: 45
    });

    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=course-enrollment-report.pdf');
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Error generating course enrollment report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

// Generate Financial Summary Report
router.post('/financial-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const payments = await Payment.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('studentId');

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Financial Summary Report', 20, 20);

    doc.setFontSize(12);
    doc.text(`Period: ${startDate} to ${endDate}`, 20, 35);

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const successfulPayments = payments.filter(p => p.status === 'completed').length;

    doc.text(`Total Payments: ${totalPayments}`, 20, 50);
    doc.text(`Successful Payments: ${successfulPayments}`, 20, 60);
    doc.text(`Total Amount Collected: $${totalAmount.toFixed(2)}`, 20, 70);

    // Payment details table
    const paymentData = payments.slice(0, 50).map(payment => [
      payment.studentId ? `${payment.studentId.firstName} ${payment.studentId.lastName}` : 'N/A',
      payment.amount ? `$${payment.amount.toFixed(2)}` : '$0.00',
      payment.status || 'Unknown',
      payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'
    ]);

    doc.autoTable({
      head: [['Student', 'Amount', 'Status', 'Date']],
      body: paymentData,
      startY: 80
    });

    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=financial-summary-report.pdf');
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Error generating financial summary report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

module.exports = router;
