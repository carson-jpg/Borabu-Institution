// Test the admission number extraction logic
const testFilenames = [
  'BTI2025_007.pdf',
  'BTI2023_001.pdf', 
  'CS2024_123.pdf',
  'MATH2022_045.pdf'
];

console.log('Testing admission number extraction from filenames:');
console.log('===================================================');

testFilenames.forEach(filename => {
  const path = require('path');
  const fileName = path.parse(filename).name;
  const admissionNo = fileName.replace(/[^a-zA-Z0-9_]/g, '');
  console.log(`Filename: ${filename} -> Admission No: ${admissionNo}`);
});

console.log('\nExpected results:');
console.log('BTI2025_007.pdf should extract: BTI2025_007');
console.log('This should match the student record with admissionNo: "BTI2025_007"');
