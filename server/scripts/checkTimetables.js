const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Timetable = require('../models/Timetable');

// Load .env from parent directory (server/.env)
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkTimetables = async () => {
  try {
    console.log('🔍 Checking MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if Timetable collection exists and count documents
    const timetableCount = await Timetable.countDocuments();
    console.log(`📊 Total timetables in database: ${timetableCount}`);

    if (timetableCount > 0) {
      console.log('\n📋 Existing timetables:');
      const timetables = await Timetable.find().populate('departmentId', 'name');
      timetables.forEach((timetable, index) => {
        console.log(`${index + 1}. ${timetable.departmentId?.name || 'Unknown'} - Year ${timetable.year} (${timetable.entries.length} classes)`);
      });
    } else {
      console.log('❌ No timetables found in database');
    }

    // Also check what collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Error checking timetables:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the check
checkTimetables();
