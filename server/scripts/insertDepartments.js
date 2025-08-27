const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Department = require("../models/Department");

// ✅ Load .env from parent directory (server/.env)
dotenv.config({ path: path.join(__dirname, "../.env") });

const departments = [
  {
    name: "Computing & Informatics",
    programs: [
      { level: "Artisan", courses: ["Computer Packages", "Computer Repair & Maintenance"] },
      { level: "Certificate", courses: ["ICT", "Computer Programming", "Graphic Design"] },
      { level: "Diploma", courses: ["ICT", "Software Development", "Web/Mobile Development", "Networking & Cybersecurity"] }
    ],
    isActive: true
  },
  {
    name: "Electrical & Electronics",
    programs: [
      { level: "Artisan", courses: ["Electrical Installation", "Electronics Repair"] },
      { level: "Certificate", courses: ["Electrical Engineering (Power)", "Electronics Engineering"] },
      { level: "Diploma", courses: ["Electrical Engineering", "Electronics & Telecommunication"] }
    ],
    isActive: true
  },
  {
    name: "Institutional Management",
    programs: [
      { level: "Artisan", courses: ["Catering & Accommodation", "Housekeeping"] },
      { level: "Certificate", courses: ["Catering & Accommodation", "Food & Beverage Management"] },
      { level: "Diploma", courses: ["Catering & Accommodation", "Food Production & Service"] }
    ],
    isActive: true
  },
  {
    name: "Business",
    programs: [
      { level: "Artisan", courses: ["Business Studies", "Storekeeping"] },
      { level: "Certificate", courses: ["Business Management", "Sales & Marketing", "Supply Chain Management"] },
      { level: "Diploma", courses: ["Business Management", "Sales & Marketing", "Procurement & Supply Chain"] }
    ],
    isActive: true
  },
  {
    name: "Mechanical Engineering",
    programs: [
      { level: "Artisan", courses: ["Motor Vehicle Mechanics", "Welding & Fabrication"] },
      { level: "Certificate", courses: ["Mechanical Engineering (Production)", "Welding & Fabrication"] },
      { level: "Diploma", courses: ["Mechanical Engineering (Production)", "Automotive Engineering"] }
    ],
    isActive: true
  },
  {
    name: "Health Sciences",
    programs: [
      { level: "Artisan", courses: ["Community Health"] },
      { level: "Certificate", courses: ["Community Health", "Nutrition & Dietetics", "Health Records"] },
      { level: "Diploma", courses: ["Community Health", "Nutrition & Dietetics", "Health Records Management"] }
    ],
    isActive: true
  },
  {
    name: "Liberal Studies",
    programs: [
      { level: "Artisan", courses: ["Social Work Support"] },
      { level: "Certificate", courses: ["Social Work & Community Development"] },
      { level: "Diploma", courses: ["Social Work & Community Development", "Early Childhood Education"] }
    ],
    isActive: true
  },
  {
    name: "Building and Construction",
    programs: [
      { level: "Artisan", courses: ["Masonry", "Carpentry & Joinery"] },
      { level: "Certificate", courses: ["Building Technology", "Plumbing"] },
      { level: "Diploma", courses: ["Building Technology", "Civil Engineering"] }
    ],
    isActive: true
  },
  {
    name: "Fashion Design, Beauty & Therapy",
    programs: [
      { level: "Artisan", courses: ["Hairdressing", "Beauty Therapy", "Tailoring & Dressmaking"] },
      { level: "Certificate", courses: ["Hairdressing & Beauty Therapy", "Fashion Design", "Cosmetology"] },
      { level: "Diploma", courses: ["Fashion Design & Clothing Technology", "Advanced Beauty Therapy", "Cosmetology & Spa Management"] }
    ],
    isActive: true
  }
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    await Department.deleteMany({});
    await Department.insertMany(departments);
    console.log("🎉 Departments inserted successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error inserting departments:", error);
    process.exit(1);
  }
};

seedDepartments();
