import React, { useState, useEffect } from 'react';
import { Download, FileText, GraduationCap, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, gradesAPI, coursesAPI } from '../../services/api';

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
      
      // Get all grades for the student
      const gradesData = await gradesAPI.getAll({ studentId: studentData._id });
      
      // Get course details for each grade
      const coursesData = await coursesAPI.getAll();
      
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

      // Filter by semester and year if specified
      let filteredGrades = transcriptGrades;
      if (selectedSemester !== 'all') {
        filteredGrades = filteredGrades.filter((g: any) => g.semester === parseInt(selectedSemester));
      }
      if (selectedYear !== 'all') {
        filteredGrades = filteredGrades.filter((g: any) => g.year === parseInt(selectedYear));
      }

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
        <button
          onClick={downloadTranscript}
          disabled={!transcriptData}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Transcript
        </button>
      </div>

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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester/Year
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transcriptData.grades.map((grade, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {grade.courseCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {grade.courseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {grade.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {grade.grade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        S{grade.semester}/{grade.year}
                      </td>
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

      {!transcriptData && !loading && (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transcript data available</h3>
          <p className="text-gray-500">Your academic transcript will be available once you have completed courses.</p>
        </div>
      )}
    </div>
  );
};

export default TranscriptDownload;
