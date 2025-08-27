const mongoose = require('mongoose');
const dotenv = require('dotenv');
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

async function testDownload() {
  try {
    console.log('Testing download functionality...');
    
    // Get the first transcript from the database
    const transcript = await Transcript.findOne();
    
    if (!transcript) {
      console.log('No transcripts found in database');
      return;
    }
    
    console.log(`Found transcript: ${transcript.originalName}`);
    console.log(`File path: ${transcript.filePath}`);
    console.log(`File size: ${transcript.fileSize} bytes`);
    
    // Check if file exists
    if (fs.existsSync(transcript.filePath)) {
      console.log('✓ File exists on server');
      
      const stats = fs.statSync(transcript.filePath);
      console.log(`✓ File size matches: ${stats.size === transcript.fileSize}`);
      
      // Test file reading
      try {
        const fileBuffer = fs.readFileSync(transcript.filePath);
        console.log(`✓ File can be read successfully (${fileBuffer.length} bytes)`);
        console.log('✓ Download functionality test passed!');
      } catch (readError) {
        console.error('✗ File reading failed:', readError.message);
      }
      
    } else {
      console.log('✗ File does not exist on server');
      console.log('Please check the file path and ensure the file was uploaded correctly');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testDownload();
}

module.exports = { testDownload };
