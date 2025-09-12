import React, { useState, useRef } from 'react';
import { studentsAPI } from '../../services/api';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface UploadResult {
  fileName: string;
  admissionNo: string;
  studentName?: string;
  status: string;
  error?: string;
}

const TranscriptUpload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      
      // Validate file types
      const validFiles = files.filter(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      
      if (validFiles.length !== files.length) {
        setMessage('Only PDF files are allowed. Non-PDF files were ignored.');
      }
      
      setSelectedFiles(validFiles);
      
      // Validate filenames for admission numbers
      const invalidFiles = validFiles.filter(file => {
        const fileName = file.name.split('.')[0]; // Remove extension
        return !fileName.match(/[A-Za-z0-9_]{3,}/); // At least 3 alphanumeric characters
      });
      
      if (invalidFiles.length > 0) {
        setMessage(prev => prev + ' Some files have invalid admission number format in filename.');
      }
    }
  };

  const handleSingleUpload = async () => {
    if (selectedFiles.length !== 1) {
      setMessage('Please select exactly one file for single upload.');
      return;
    }

    setUploading(true);
    setMessage('');
    setUploadResults([]);

    const formData = new FormData();
    formData.append('transcript', selectedFiles[0]);

    try {
      const result = await studentsAPI.uploadTranscript(formData);
      setMessage(`Transcript uploaded successfully for ${result.studentName && result.studentName.trim() !== '' ? result.studentName : result.admissionNo}`);
      setUploadResults([{
        fileName: selectedFiles[0].name,
        admissionNo: result.admissionNo,
        studentName: result.studentName,
        status: 'success'
      }]);
    } catch (error: any) {
      console.error('Error uploading transcript:', error);
      setMessage(error.message || 'Failed to upload transcript.');
      setUploadResults([{
        fileName: selectedFiles[0].name,
        admissionNo: 'unknown',
        status: 'error',
        error: error.message
      }]);
    } finally {
      setUploading(false);
    }
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage('Please select at least one file for batch upload.');
      return;
    }

    setUploading(true);
    setMessage('');
    setUploadResults([]);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('transcripts', file);
    });

    try {
      const result = await studentsAPI.uploadTranscriptsBatch(formData);
      setMessage(`Batch upload completed: ${result.successful} successful, ${result.failed} failed`);
      setUploadResults([...result.results, ...result.errors.map((err: any) => ({
        fileName: err.fileName,
        admissionNo: err.admissionNo || 'unknown',
        status: 'error',
        error: err.error
      }))]);
    } catch (error: any) {
      console.error('Error in batch upload:', error);
      setMessage(error.message || 'Failed to process batch upload.');
    } finally {
      setUploading(false);
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <FileText className="h-8 w-8 text-blue-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-900">Transcript Management</h2>
      </div>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Transcript Files (PDF only)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
          className="w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Files should be named with admission numbers (e.g., BTI2023_001.pdf)
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600 truncate">{file.name}</span>
                <span className="text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleSingleUpload}
          disabled={uploading || selectedFiles.length !== 1}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading && selectedFiles.length === 1 ? 'Uploading...' : 'Upload Single'}
        </button>
        
        <button
          onClick={handleBatchUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading && selectedFiles.length > 1 ? 'Uploading Batch...' : 'Upload Batch'}
        </button>
        
        {selectedFiles.length > 0 && (
          <button
            onClick={clearFiles}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            Clear Files
          </button>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-md mb-6 ${
          message.includes('success') ? 'bg-green-50 text-green-700' : 
          message.includes('error') || message.includes('failed') ? 'bg-red-50 text-red-700' : 
          'bg-yellow-50 text-yellow-700'
        }`}>
          {message}
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Upload Results</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadResults.map((result, index) => (
              <div key={index} className="flex items-center p-3 rounded-md border">
                {getStatusIcon(result.status)}
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">{result.fileName}</div>
                  <div className="text-xs text-gray-500">
                    {result.admissionNo} {result.studentName && `- ${result.studentName}`}
                  </div>
                  {result.error && (
                    <div className="text-xs text-red-500 mt-1">{result.error}</div>
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  result.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Files must be in PDF format</li>
          <li>• Filenames should contain admission numbers (e.g., BTI2023_001.pdf)</li>
          <li>• Single upload: Process one file at a time</li>
          <li>• Batch upload: Process multiple files simultaneously</li>
          <li>• Files will be automatically matched to students by admission number</li>
        </ul>
      </div>
    </div>
  );
};

export default TranscriptUpload;
