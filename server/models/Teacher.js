const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);
