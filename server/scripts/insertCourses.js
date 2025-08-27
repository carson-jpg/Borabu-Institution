const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Course = require("../models/Course");
const Department = require("../models/Department");
const Teacher = require("../models/Teacher");

// Load .env from parent directory (server/.env)
dotenv.config({ path: path.join(__dirname, "../.env") });

const courses = [
  // Computing & Informatics
  { name: "Computer Packages", code: "CI-A101", level: "Artisan", departmentName: "Computing & Informatics", credits: 3 },
  { name: "Computer Repair & Maintenance", code: "CI-A102", level: "Artisan", departmentName: "Computing & Informatics", credits: 3 },
  { name: "ICT", code: "CI-C101", level: "Certificate", departmentName: "Computing & Informatics", credits: 3 },
  { name: "Computer Programming", code: "CI-C102", level: "Certificate", departmentName: "Computing & Informatics", credits: 3 },
  { name: "Graphic Design", code: "CI-C103", level: "Certificate", departmentName: "Computing & Informatics", credits: 3 },
  { name: "ICT", code: "CI-D101", level: "Diploma", departmentName: "Computing & Informatics", credits: 3 },
  { name: "Software Development", code: "CI-D102", level: "Diploma", departmentName: "Computing & Informatics", credits: 3 },
  { name: "Web/Mobile Development", code: "CI-D103", level: "Diploma", departmentName: "Computing & Informatics", credits: 3 },
  { name: "Networking & Cybersecurity", code: "CI-D104", level: "Diploma", departmentName: "Computing & Informatics", credits: 3 },

  // Electrical & Electronics
  { name: "Electrical Installation", code: "EE-A101", level: "Artisan", departmentName: "Electrical & Electronics", credits: 3 },
  { name: "Electronics Repair", code: "EE-A102", level: "Artisan", departmentName: "Electrical & Electronics", credits: 3 },
  { name: "Electrical Engineering (Power)", code: "EE-C101", level: "Certificate", departmentName: "Electrical & Electronics", credits: 3 },
  { name: "Electronics Engineering", code: "EE-C102", level: "Certificate", departmentName: "Electrical & Electronics", credits: 3 },
  { name: "Electrical Engineering", code: "EE-D101", level: "Diploma", departmentName: "Electrical & Electronics", credits: 3 },
  { name: "Electronics & Telecommunication", code: "EE-D102", level: "Diploma", departmentName: "Electrical & Electronics", credits: 3 },

  // Institutional Management
  { name: "Catering & Accommodation", code: "IM-A101", level: "Artisan", departmentName: "Institutional Management", credits: 3 },
  { name: "Housekeeping", code: "IM-A102", level: "Artisan", departmentName: "Institutional Management", credits: 3 },
  { name: "Catering & Accommodation", code: "IM-C101", level: "Certificate", departmentName: "Institutional Management", credits: 3 },
  { name: "Food & Beverage Management", code: "IM-C102", level: "Certificate", departmentName: "Institutional Management", credits: 3 },
  { name: "Catering & Accommodation", code: "IM-D101", level: "Diploma", departmentName: "Institutional Management", credits: 3 },
  { name: "Food Production & Service", code: "IM-D102", level: "Diploma", departmentName: "Institutional Management", credits: 3 },

  // Business
  { name: "Business Studies", code: "BU-A101", level: "Artisan", departmentName: "Business", credits: 3 },
  { name: "Storekeeping", code: "BU-A102", level: "Artisan", departmentName: "Business", credits: 3 },
  { name: "Business Management", code: "BU-C101", level: "Certificate", departmentName: "Business", credits: 3 },
  { name: "Sales & Marketing", code: "BU-C102", level: "Certificate", departmentName: "Business", credits: 3 },
  { name: "Supply Chain Management", code: "BU-C103", level: "Certificate", departmentName: "Business", credits: 3 },
  { name: "Business Management", code: "BU-D101", level: "Diploma", departmentName: "Business", credits: 3 },
  { name: "Sales & Marketing", code: "BU-D102", level: "Diploma", departmentName: "Business", credits: 3 },
  { name: "Procurement & Supply Chain", code: "BU-D103", level: "Diploma", departmentName: "Business", credits: 3 },

  // Mechanical Engineering
  { name: "Motor Vehicle Mechanics", code: "ME-A101", level: "Artisan", departmentName: "Mechanical Engineering", credits: 3 },
  { name: "Welding & Fabrication", code: "ME-A102", level: "Artisan", departmentName: "Mechanical Engineering", credits: 3 },
  { name: "Mechanical Engineering (Production)", code: "ME-C101", level: "Certificate", departmentName: "Mechanical Engineering", credits: 3 },
  { name: "Welding & Fabrication", code: "ME-C102", level: "Certificate", departmentName: "Mechanical Engineering", credits: 3 },
  { name: "Mechanical Engineering (Production)", code: "ME-D101", level: "Diploma", departmentName: "Mechanical Engineering", credits: 3 },
  { name: "Automotive Engineering", code: "ME-D102", level: "Diploma", departmentName: "Mechanical Engineering", credits: 3 },

  // Health Sciences
  { name: "Community Health", code: "HS-A101", level: "Artisan", departmentName: "Health Sciences", credits: 3 },
  { name: "Community Health", code: "HS-C101", level: "Certificate", departmentName: "Health Sciences", credits: 3 },
  { name: "Nutrition & Dietetics", code: "HS-C102", level: "Certificate", departmentName: "Health Sciences", credits: 3 },
  { name: "Health Records", code: "HS-C103", level: "Certificate", departmentName: "Health Sciences", credits: 3 },
  { name: "Community Health", code: "HS-D101", level: "Diploma", departmentName: "Health Sciences", credits: 3 },
  { name: "Nutrition & Dietetics", code: "HS-D102", level: "Diploma", departmentName: "Health Sciences", credits: 3 },
  { name: "Health Records Management", code: "HS-D103", level: "Diploma", departmentName: "Health Sciences", credits: 3 },

  // Liberal Studies
  { name: "Social Work Support", code: "LS-A101", level: "Artisan", departmentName: "Liberal Studies", credits: 3 },
  { name: "Social Work & Community Development", code: "LS-C101", level: "Certificate", departmentName: "Liberal Studies", credits: 3 },
  { name: "Social Work & Community Development", code: "LS-D101", level: "Diploma", departmentName: "Liberal Studies", credits: 3 },
  { name: "Early Childhood Education", code: "LS-D102", level: "Diploma", departmentName: "Liberal Studies", credits: 3 },

  // Building & Construction
  { name: "Masonry", code: "BC-A101", level: "Artisan", departmentName: "Building and Construction", credits: 3 },
  { name: "Carpentry & Joinery", code: "BC-A102", level: "Artisan", departmentName: "Building and Construction", credits: 3 },
  { name: "Building Technology", code: "BC-C101", level: "Certificate", departmentName: "Building and Construction", credits: 3 },
  { name: "Plumbing", code: "BC-C102", level: "Certificate", departmentName: "Building and Construction", credits: 3 },
  { name: "Building Technology", code: "BC-D101", level: "Diploma", departmentName: "Building and Construction", credits: 3 },
  { name: "Civil Engineering", code: "BC-D102", level: "Diploma", departmentName: "Building and Construction", credits: 3 },

  // Fashion Design, Beauty & Therapy
  { name: "Hairdressing", code: "FB-A101", level: "Artisan", departmentName: "Fashion Design, Beauty & Therapy", credits: 3 },
  { name: "Beauty Therapy", code: "FB-A102", level: "Artisan", departmentName: "Fashion Design, Beauty & Therapy", credits: 3 },
  { name: "Tailoring & Dressmaking", code: "FB-A103", level: "Artisan", departmentName: "Fashion Design, Beauty & Therapy", credits: 3 },
  { name: "Hairdressing & Beauty Therapy", code: "FB-C101", level: "Certificate", departmentName: "Fashion Design, Beauty & Therapy", credits: 3 },
  { name: "Fashion Design", code: "FB-C102", level: "Certificate", departmentName: "Fashion Design, Beauty & Therapy", credits: 3 },
  { name: "Cosmetology", code: "FB-C103", level: "Certificate", departmentName: "Fashion Design, Beauty & Therapy", credits: 3 },
  { name: "Fashion Design & Clothing Technology", code: "FB-D101", level: "Diploma", departmentName: "Fashion Design, Beauty & Therapy", credits: 3 },
  { name: "Advanced Beauty Therapy", code: "FB-D102", level: "Diploma", departmentName: "Fashion Design, Beauty & Therapy", credits: 3 },
  { name: "Cosmetology & Spa Management", code: "FB-D103", level: "Diploma", departmentName: "Fashion Design, Beauty & Therapy", credits: 3 }
];


const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all departments to set departmentId
    const allDepartments = await Department.find();
    const departmentMap = allDepartments.reduce((acc, dept) => {
      acc[dept.name] = dept._id;
      return acc;
    }, {});

    // Get all teachers to assign to courses.
    const teachers = await Teacher.find();
    if (!teachers || teachers.length === 0) {
      console.error("❌ No teachers found in the database. Please seed teachers first.");
      process.exit(1);
    }

    // Assign departmentId and teacherId to each course
    const coursesToInsert = courses.map(course => {
      const departmentId = departmentMap[course.departmentName];
      if (!departmentId) {
        console.warn(`⚠️  Department "${course.departmentName}" not found for course "${course.name}". Skipping.`);
        return null;
      }
      // remove departmentName before inserting
      const { departmentName, ...rest } = course;
      // Assign a random teacher from the available teachers
      const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
      console.log(`Assigning teacher ID: ${randomTeacher._id} to course: ${course.name}`);
      return {
        ...rest,
        departmentId: departmentId,
        teacherId: randomTeacher._id
      };
    }).filter(course => course !== null);

    await Course.deleteMany({});
    await Course.insertMany(coursesToInsert);
    console.log(`🎉 ${coursesToInsert.length} courses inserted successfully`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error inserting courses:", error);
    process.exit(1);
  }
};

seedCourses();
