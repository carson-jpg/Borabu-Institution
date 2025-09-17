import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { timetablesAPI, departmentsAPI } from '../../services/api';

interface BulkUploadResult {
  success: boolean;
  message: string;
  data?: any;
}

const TimetableBulkUpload: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<BulkUploadResult[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [academicYear, setAcademicYear] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll();
      const departmentsData = response.data || response;
      setDepartments(departmentsData);
      if (departmentsData.length > 0) {
        setSelectedDepartment(departmentsData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setResults([]);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `courseCode,teacherEmail,dayOfWeek,startTime,endTime,room,type,semester
CS101,john.doe@example.com,Monday,09:00,10:30,Lab 101,Lecture,1
CS102,jane.smith@example.com,Tuesday,10:45,12:15,Room 201,Practical,1
MATH101,bob.johnson@example.com,Wednesday,14:00,15:30,Room 301,Tutorial,2
PHYS101,alice.wilson@example.com,Thursday,16:00,17:30,Lab 102,Lab,1`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timetable_bulk_upload_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file || !selectedDepartment) {
      alert('Please select a file and department');
      return;
    }

    setUploading(true);
    setResults([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('departmentId', selectedDepartment);
      formData.append('year', selectedYear.toString());
      formData.append('academicYear', academicYear);

      const response = await timetablesAPI.bulkUpload(formData);

      setResults([{
        success: true,
        message: response.message || 'Timetable uploaded successfully',
        data: response.timetable
      }]);

      onSuccess();

    } catch (error: any) {
      console.error('Bulk upload error:', error);

      let errorMessage = 'Upload failed';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        setResults(validationErrors.map((err: string) => ({
          success: false,
          message: err
        })));
      } else {
        setResults([{
          success: false,
          message: errorMessage
        }]);
      }
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Bulk Upload Timetable</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Upload Instructions</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Download the CSV template to see the required format</li>
              <li>• Required columns: courseCode, teacherEmail, dayOfWeek, startTime, endTime, room, type, semester</li>
              <li>• Day format: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday</li>
              <li>• Time format: HH:MM (24-hour)</li>
              <li>• Type: Lecture, Practical, Tutorial, Lab</li>
              <li>• Semester: 1 or 2</li>
            </ul>
          </div>

          {/* Department and Year Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
                <option value={4}>Year 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year *
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="2024-2025"
                required
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Upload CSV File *
              </label>
              <button
                onClick={downloadTemplate}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Download Template
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />

              {!file ? (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Click to select file
                  </label>
                  <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-2">CSV files only</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Upload Results</h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-md ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    )}
                    <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || !selectedDepartment}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
            >
              {uploading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              {uploading ? 'Uploading...' : 'Upload Timetable'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableBulkUpload;
