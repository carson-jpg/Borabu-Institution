import React, { useState, useEffect } from 'react';
import { Download, FileText, GraduationCap, Eye, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, gradesAPI, coursesAPI, transcriptsAPI, departmentsAPI } from '../../services/api';

interface TranscriptData {
  student: {
    name: string;
    admissionNo: string;
    department: string;
  };
  grades: Array<{
    courseCode: string;
    courseName: string;
    credits: number;
    grade: string;
    semester: number;
    year: number;
  }>;
  gpa: number;
  totalCredits: number;
}

const TranscriptDownload: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [pdfTranscripts, setPdfTranscripts] = useState<any[]>([]);
  const [previewTranscript, setPreviewTranscript] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [departmentData, setDepartmentData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchTranscriptData();
      fetchPdfTranscripts();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchTranscriptData();
    }
  }, [user, selectedSemester, selectedYear]);

  const fetchTranscriptData = async () => {
    setLoading(true);
    try {
      // Get student data
      const studentData = await studentsAPI.getByUserId(user?.id || '');
      setStudentData(studentData);
      console.log('Student Data:', studentData);

      // Get department data to get programme info
      const deptData = await departmentsAPI.getById(studentData.departmentId._id);
      setDepartmentData(deptData);
      console.log('Department Data:', deptData);

      // Get all grades for the student
      const gradesData = await gradesAPI.getAll({ studentId: studentData._id });
      console.log('Grades Data:', gradesData);

      // Get course details for each grade
      const coursesData = await coursesAPI.getAll();
      console.log('Courses Data:', coursesData);
      
      const transcriptGrades = gradesData.map((grade: any) => {
        const course = coursesData.find((c: any) => c._id === grade.courseId._id);
        return {
          courseCode: course?.code || '',
          courseName: course?.name || '',
          credits: course?.credits || 0,
          grade: grade.grade,
          semester: grade.semester,
          year: grade.year
        };
      });
      console.log('Transcript Grades:', transcriptGrades);

      // Filter by semester and year if specified
      let filteredGrades = transcriptGrades;
      if (selectedSemester !== 'all') {
        filteredGrades = filteredGrades.filter((g: any) => g.semester === parseInt(selectedSemester));
      }
      if (selectedYear !== 'all') {
        filteredGrades = filteredGrades.filter((g: any) => g.year === parseInt(selectedYear));
      }
      console.log('Filtered Grades:', filteredGrades);

      // Calculate GPA (simplified calculation)
      const gradePoints: { [key: string]: number } = {
        'Mastery': 4.0,
        'Proficiency': 3.0,
        'Competent': 2.0,
        'Not Yet Competent': 0.0
      };

      const totalCredits = filteredGrades.reduce((sum: number, grade: any) => sum + grade.credits, 0);
      const totalGradePoints = filteredGrades.reduce((sum: number, grade: any) => {
        return sum + (gradePoints[grade.grade] || 0) * grade.credits;
      }, 0);

      const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

      setTranscriptData({
        student: {
          name: studentData.userId?.name || '',
          admissionNo: studentData.admissionNo || '',
          department: studentData.departmentId?.name || ''
        },
        grades: filteredGrades,
        gpa: parseFloat(gpa.toFixed(2)),
        totalCredits
      });

    } catch (error) {
      console.error('Error fetching transcript data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPdfTranscripts = async () => {
    try {
      const studentData = await studentsAPI.getByUserId(user?.id || '');
      setStudentData(studentData);
      const transcriptsData = await transcriptsAPI.getByStudentId(studentData._id);
      setPdfTranscripts(transcriptsData);
    } catch (error) {
      console.error('Error fetching PDF transcripts:', error);
    }
  };

  const downloadTranscript = () => {
    if (!transcriptData) return;

    // Create a simple text transcript
    const transcriptText = `
      OFFICIAL TRANSCRIPT
      ===================

      Student: ${transcriptData.student.name}
      Admission No: ${transcriptData.student.admissionNo}
      Department: ${transcriptData.student.department}

      Course Grades:
      ${transcriptData.grades.map(grade =>
        `${grade.courseCode} - ${grade.courseName} (${grade.credits} credits): ${grade.grade}`
      ).join('\n      ')}

      Total Credits: ${transcriptData.totalCredits}
      GPA: ${transcriptData.gpa}

      Generated on: ${new Date().toLocaleDateString()}
    `;

    // Create download link
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${transcriptData.student.admissionNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPdfTranscript = async (transcript: any) => {
    try {
      await transcriptsAPI.download(transcript._id);
    } catch (error) {
      console.error('Error downloading PDF transcript:', error);
      alert('Failed to download transcript. Please try again.');
    }
  };

  const previewTranscriptHandler = (transcript: any) => {
    setPreviewTranscript(transcript);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewTranscript(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Academic Transcript</h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => previewTranscriptHandler(null)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              disabled={!transcriptData}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Transcript
            </button>
            <button
              onClick={downloadTranscript}
              disabled={!transcriptData}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Transcript
            </button>
          </div>
        </div>
        {/* Added header info similar to the sample */}
        {transcriptData && departmentData && (
          <div className="mb-6 border border-gray-300 rounded p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div><strong>Student Name:</strong> {transcriptData.student.name}</div>
              <div><strong>Admission No:</strong> {transcriptData.student.admissionNo}</div>
              <div><strong>Programme:</strong> {departmentData.programs && departmentData.programs.length > 0 ? `${departmentData.name} ${departmentData.programs[0].level}` : departmentData.name}</div>
              <div><strong>Department:</strong> {transcriptData.student.department}</div>
              <div><strong>Academic Year:</strong> {new Date().getFullYear()}</div>
              <div><strong>Academic Term:</strong> Term 1 {new Date().getFullYear()}</div>
              <div><strong>Year of Study:</strong> YEAR {studentData?.year || 1}</div>
              <div><strong>Class:</strong> {departmentData.programs && departmentData.programs.length > 0 ? `${departmentData.programs[0].level.replace(/\D/g, '')}L${studentData?.year || 1}` : 'N/A'}</div>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>
      </div>

      {transcriptData && (
        <div className="space-y-6">
          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="font-medium">{transcriptData.student.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Admission No:</span>
                <p className="font-medium">{transcriptData.student.admissionNo}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Department:</span>
                <p className="font-medium">{transcriptData.student.department}</p>
              </div>
            </div>
          </div>

      {/* Grades Table */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Course Grades</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-black">
            <thead className="bg-gray-50 border-b border-black">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-black">CODE</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-black">NAME</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-black">F.A.T. 60%</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-black">S.A.T. 40%</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-black">TOTAL 100%</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-black">GRADE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 border border-black">
              {transcriptData.grades.map((grade, index) => (
                <tr key={index} className="border-b border-black">
                  <td className="px-3 py-1 whitespace-nowrap text-xs font-medium text-gray-900 border-r border-black">{grade.courseCode}</td>
                  <td className="px-3 py-1 text-xs text-gray-900 border-r border-black">{grade.courseName}</td>
                  <td className="px-3 py-1 text-center text-xs text-gray-900 border-r border-black">-</td>
                  <td className="px-3 py-1 text-center text-xs text-gray-900 border-r border-black">-</td>
                  <td className="px-3 py-1 text-center text-xs text-gray-900 border-r border-black">-</td>
                  <td className="px-3 py-1 text-center text-xs font-medium text-green-600 border-black">{grade.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Academic Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Total Credits:</span>
                <p className="text-lg font-bold text-blue-600">{transcriptData.totalCredits}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">GPA:</span>
                <p className="text-lg font-bold text-blue-600">{transcriptData.gpa}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Transcripts Section */}
      {pdfTranscripts.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Transcripts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdfTranscripts.map((transcript) => (
              <div key={transcript._id} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-6 w-6 text-red-600" />
                  <span className="text-sm text-gray-500">
                    {new Date(transcript.uploadDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-3">
                  {transcript.filename || 'Transcript Document'}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => previewTranscriptHandler(transcript)}
                    className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={() => downloadPdfTranscript(transcript)}
                    className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!transcriptData && !loading && (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transcript data available</h3>
          <p className="text-gray-500">Your academic transcript will be available once you have completed courses.</p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {previewTranscript ? (previewTranscript.filename || 'Transcript Preview') : 'Generated Transcript Preview'}
              </h3>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {previewTranscript ? (
                <iframe
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/transcripts/view/${previewTranscript._id}`}
                  className="w-full h-[600px] border rounded"
                  title="Transcript Preview"
                />
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {transcriptData ? `
OFFICIAL TRANSCRIPT
===================

Student: ${transcriptData.student.name}
Admission No: ${transcriptData.student.admissionNo}
Department: ${transcriptData.student.department}

Course Grades:
${transcriptData.grades.map(grade =>
  `${grade.courseCode} - ${grade.courseName} (${grade.credits} credits): ${grade.grade}`
).join('\n')}

Total Credits: ${transcriptData.totalCredits}
GPA: ${transcriptData.gpa}

Generated on: ${new Date().toLocaleDateString()}
                  ` : 'No transcript data available for preview.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptDownload;
