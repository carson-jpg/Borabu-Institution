const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');
const Transcript = require('../models/Transcript');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function migrateTranscripts() {
  try {
    console.log('Starting transcript migration...');
    
    // Get all students with transcripts
    const students = await Student.find({ 'transcripts.0': { $exists: true } });
    
    console.log(`Found ${students.length} students with transcripts to migrate`);
    
    let totalMigrated = 0;
    let totalErrors = 0;
    
    for (const student of students) {
      console.log(`Migrating transcripts for student: ${student.admissionNo}`);
      
      for (const oldTranscript of student.transcripts) {
        try {
          // Check if file still exists
          if (!fs.existsSync(oldTranscript.filePath)) {
            console.log(`File not found: ${oldTranscript.filePath}, skipping...`);
            totalErrors++;
            continue;
          }
          
          // Get file stats
          const stats = fs.statSync(oldTranscript.filePath);
          
          // Create new transcript entry
          const newTranscript = new Transcript({
            studentId: student._id,
            filePath: oldTranscript.filePath,
            originalName: oldTranscript.originalName,
            admissionNo: student.admissionNo,
            uploadedBy: null, // We don't have this info from old data
            fileSize: stats.size,
            mimeType: 'application/pdf'
          });
          
          await newTranscript.save();
          totalMigrated++;
          
          console.log(`✓ Migrated: ${oldTranscript.originalName}`);
          
        } catch (error) {
          console.error(`Error migrating transcript ${oldTranscript.originalName}:`, error.message);
          totalErrors++;
        }
      }
      
      // Remove transcripts from student document
      student.transcripts = [];
      await student.save();
      console.log(`✓ Cleared transcripts from student: ${student.admissionNo}`);
    }
    
    console.log('\nMigration completed!');
    console.log(`Total transcripts migrated: ${totalMigrated}`);
    console.log(`Total errors: ${totalErrors}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateTranscripts();
}

module.exports = { migrateTranscripts };
