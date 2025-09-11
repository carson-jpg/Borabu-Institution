// Debug script to test the download endpoint
const fs = require('fs');
const path = require('path');

// Create a simple test to check if the uploads directory structure is correct
const uploadsDir = path.join(__dirname, 'server', 'uploads', 'transcripts');
console.log('Uploads directory path:', uploadsDir);
console.log('Uploads directory exists:', fs.existsSync(uploadsDir));

// Check if we can create a test file in the uploads directory
const testFilePath = path.join(uploadsDir, 'test_file.pdf');
try {
  fs.writeFileSync(testFilePath, '%PDF-1.4\nTest Content');
  console.log('Test file created successfully:', testFilePath);
  console.log('Test file exists:', fs.existsSync(testFilePath));
  
  // Clean up
  fs.unlinkSync(testFilePath);
  console.log('Test file cleaned up');
} catch (error) {
  console.error('Error creating test file:', error.message);
}

// Test the path resolution that would be used in the download endpoint
const exampleFilePath = path.join(uploadsDir, 'BTI2023_001.pdf');
console.log('Example file path that would be used:', exampleFilePath);
console.log('Example file exists (should be false):', fs.existsSync(exampleFilePath));

console.log('\nTo test the download functionality:');
console.log('1. Start the server: npm run dev');
console.log('2. Upload a transcript first to populate the database');
console.log('3. Check server logs for file path debug information');
console.log('4. Verify the file actually exists at the path shown in logs');
