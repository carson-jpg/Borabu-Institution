const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Course = require("./server/models/Course");

// Load .env from parent directory (server/.env)
dotenv.config({ path: path.join(__dirname, "server/.env") });

const checkCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check a few courses to see their teacher IDs
    const courses = await Course.find().limit(5);
    console.log("Sample courses with teacher IDs:");
    courses.forEach(course => {
      console.log(`- ${course.name}: teacherId = ${course.teacherId}`);
    });

    // Check if teacherId field exists in the schema
    const courseSchema = Course.schema;
    const teacherIdField = courseSchema.path('teacherId');
    console.log(`\nTeacher ID field in schema:`, teacherIdField);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking courses:", error);
    process.exit(1);
  }
};

checkCourses();
