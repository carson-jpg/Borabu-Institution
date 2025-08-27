const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Teacher = require("../models/Teacher");
const Department = require("../models/Department");

dotenv.config({ path: path.join(__dirname, "../.env") });

const teachers = [
  { name: "John Doe", email: "jdoe@school.com", department: "Computing & Informatics" },
  { name: "Mary Wanjiku", email: "mwanjiku@school.com", department: "Business" },
  { name: "Ali Yusuf", email: "ayusuf@school.com", department: "Health Sciences" },
  { name: "Grace Kamau", email: "gkamau@school.com", department: "Electrical & Electronics" },
  { name: "Peter Otieno", email: "potieno@school.com", department: "Mechanical Engineering" },
  { name: "Jane Mwende", email: "jmwende@school.com", department: "Fashion Design, Beauty & Therapy" },
  { name: "Samuel Kiprop", email: "skiprop@school.com", department: "Building and Construction" },
  { name: "Linet Achieng", email: "lachieng@school.com", department: "Institutional Management" },
  { name: "Brian Mutua", email: "bmutua@school.com", department: "Liberal Studies" }
];

const seedTeachers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const departments = await Department.find();
    const departmentMap = {};
    departments.forEach((dept) => {
      departmentMap[dept.name] = dept._id;
    });

    const teacherDocs = teachers.map((teacher) => ({
      name: teacher.name,
      email: teacher.email,
      departmentId: departmentMap[teacher.department]
    }));

    await Teacher.deleteMany({});
    await Teacher.insertMany(teacherDocs);
    console.log("🎉 Teachers inserted successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error inserting teachers:", error);
    process.exit(1);
  }
};

seedTeachers();
