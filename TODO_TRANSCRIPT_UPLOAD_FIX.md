# Transcript Upload Fix - TODO

## Issue
- Error: "ze.uploadTranscript is not a function" in TranscriptUpload component
- Frontend trying to call studentsAPI.uploadTranscript() and studentsAPI.uploadTranscriptsBatch() but methods not defined

## Completed
- [x] Added uploadTranscript method to studentsAPI in src/services/api.ts
- [x] Added uploadTranscriptsBatch method to studentsAPI in src/services/api.ts
- [x] Backend routes already exist in server/routes/students.js (/upload-transcript and /upload-transcripts)

## Testing
- [ ] Test single file upload functionality
- [ ] Test batch upload functionality
- [ ] Verify error handling works correctly
- [ ] Check that files are properly saved and linked to students

## Notes
- Backend uses multer for file uploads
- Files are stored in server/uploads/transcripts/
- Admission numbers are extracted from filenames
- Students are matched by admission number
