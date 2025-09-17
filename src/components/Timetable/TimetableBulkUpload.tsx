import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { timetablesAPI, departmentsAPI } from '../../services/api';

interface BulkUploadResult {
  success: boolean;
  message: string;
  data?: any;
}

interface UploadProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
}

const TimetableBulkUpload: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
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
        alert('Please select a CSV or Excel file (.csv, .xls, .xlsx)');
        return;
      }
      setFile(selectedFile);
      setResults([]);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `course_code,course_name,teacher_name,day_of_week,start_time,end_time,room,type,semester
CS101,Introduction to Programming,Dr. Smith,Monday,09:00,11:00,Lab 101,Lecture,1
CS102,Data Structures,Dr. Johnson,Tuesday,10:00,12:00,Room 201,Practical,1
CS103,Algorithms,Dr. Brown,Wednesday,14:00,16:00,Lab 102,Tutorial,2`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timetable_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const processCSV = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

          // Validate headers
          const requiredHeaders = ['course_code', 'course_name', 'teacher_name', 'day_of_week', 'start_time', 'end_time', 'room', 'type', 'semester'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

          if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
          }

          const entries = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            return {
              courseCode: values[0],
              courseName: values[1],
              teacherName: values[2],
              dayOfWeek: values[3],
              startTime: values[4],
              endTime: values[5],
              room: values[6],
              type: values[7],
              semester: parseInt(values[8]) || 1,
              lineNumber: index + 2
            };
          });

          resolve(entries);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleUpload = async () => {
    if (!file || !selectedDepartment) {
      alert('Please select a file and department');
      return;
    }

    setUploading(true);
    setProgress({ total: 0, processed: 0, successful: 0, failed: 0 });
    setResults([]);

    try {
      const entries = await processCSV(file);
      setProgress({ total: entries.length, processed: 0, successful: 0, failed: 0 });

      const uploadResults: BulkUploadResult[] = [];

      // Process entries in batches to avoid overwhelming the server
      const batchSize = 5;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);

        for (const entry of batch) {
          try {
            // Find course by code
            const coursesResponse = await fetch(`https://borabu-institution-8.onrender.com/api/courses?department=${selectedDepartment}`);
            const courses = await coursesResponse.json();
            const course = courses.find((c: any) => c.code === entry.courseCode);

            if (!course) {
              uploadResults.push({
                success: false,
                message: `Line ${entry.lineNumber}: Course ${entry.courseCode} not found`
              });
              continue;
            }

            // Find teacher by name
            const teachersResponse = await fetch('https://borabu-institution-8.onrender.com/api/users?role=teacher');
            const teachers = await teachersResponse.json();
            const teacher = teachers.find((t: any) => t.name === entry.teacherName);

            if (!teacher) {
              uploadResults.push({
                success: false,
                message: `Line ${entry.lineNumber}: Teacher ${entry.teacherName} not found`
              });
              continue;
            }

            // Create timetable entry
            const timetableData = {
              departmentId: selectedDepartment,
              year: selectedYear,
              academicYear,
              entries: [{
                courseId: course._id,
                teacherId: teacher._id,
                dayOfWeek: entry.dayOfWeek,
                startTime: entry.startTime,
                endTime: entry.endTime,
                room: entry.room,
                type: entry.type,
                semester: entry.semester
              }]
            };

            await timetablesAPI.create(timetableData);

            uploadResults.push({
              success: true,
              message: `Line ${entry.lineNumber}: Successfully added ${entry.courseName}`
            });

          } catch (error: any) {
            uploadResults.push({
              success: false,
              message: `Line ${entry.lineNumber}: ${error.message || 'Unknown error'}`
            });
          }

          setProgress(prev => prev ? {
            ...prev,
            processed: prev.processed + 1,
            successful: uploadResults.filter(r => r.success).length,
            failed: uploadResults.filter(r => !r.success).length
          } : null);
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setResults(uploadResults);

      if (uploadResults.some(r => r.success)) {
        onSuccess();
      }

    } catch (error: any) {
      setResults([{
        success: false,
        message: `Upload failed: ${error.message}`
      }]);
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
              <li>• Required columns: course_code, course_name, teacher_name, day_of_week, start_time, end_time, room, type, semester</li>
              <li>• Day format: Monday, Tuesday, Wednesday, Thursday, Friday</li>
              <li>• Time format: HH:MM (24-hour)</li>
              <li>• Type: Lecture, Practical, Tutorial, Lab</li>
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
                accept=".csv,.xls,.xlsx"
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
                  <p className="text-xs text-gray-400 mt-2">CSV, Excel files only</p>
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

          {/* Progress */}
          {progress && (
            <div className="mb-6">
              <div className="bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                Processing: {progress.processed}/{progress.total} entries
                ({progress.successful} successful, {progress.failed} failed)
              </p>
            </div>
          )}

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
