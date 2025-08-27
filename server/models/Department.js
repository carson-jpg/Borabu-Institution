const mongoose = require("mongoose");

const programSchema = new mongoose.Schema({
  level: { type: String, required: true },   // Artisan, Certificate, Diploma
  courses: [{ type: String, required: true }] // List of courses
});

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  programs: [programSchema],
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("Department", departmentSchema);
