const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    photo: { type: String }, // URL to profile photo
    qualifications: [{ type: String }], // Array of qualifications
    bio: { type: String },
    phone: { type: String },
    officeHours: { type: String },
    specializations: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", TeacherSchema);
