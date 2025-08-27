import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesAPI, studentsAPI, gradesAPI } from '../../services/api';

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface Student {
  _id: string;
  name: string;
  admissionNo: string;
}

const GradeManagement: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<{ [key: string]: string }>({});
  const [semester, setSemester] = useState<number>(1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching all courses');
        const coursesData = await coursesAPI.getAll(); // Fetch all courses instead of filtering by teacher
        console.log('Courses data received:', coursesData);
        setCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    const fetchStudentsAndGrades = async () => {
      if (!selectedCourse) return;

      try {
        const studentsData = await studentsAPI.getAll();
        const enrolledStudents = studentsData.filter((student: any) => 
          student.courses.includes(selectedCourse)
        );
        setStudents(enrolledStudents);

        // Fetch existing grades for this course
        const existingGrades = await gradesAPI.getAll({ 
          courseId: selectedCourse,
          semester,
          year
        });

        // Initialize grades object with existing grades or default values
        const initialGrades: { [key: string]: string } = {};
        enrolledStudents.forEach((student: Student) => {
          const existingGrade = existingGrades.find((g: any) => g.studentId._id === student._id);
          initialGrades[student._id] = existingGrade ? existingGrade.grade : '';
        });
        setGrades(initialGrades);
      } catch (error) {
        console.error('Error fetching students and grades:', error);
      }
    };

    fetchStudentsAndGrades();
  }, [selectedCourse, semester, year]);

  const handleGradeChange = (studentId: string, grade: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: grade
    }));
  };

  const submitGrades = async () => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }

    setSubmitting(true);
    try {
      const gradeEntries = Object.entries(grades);
      const validGrades = gradeEntries.filter(([_, grade]) => grade.trim() !== '');

      if (validGrades.length === 0) {
        alert('Please enter grades for at least one student');
        setSubmitting(false);
        return;
      }

      for (const [studentId, grade] of validGrades) {
        await gradesAPI.create({
          studentId,
          courseId: selectedCourse,
          grade,
          semester,
          year
        });
      }

      alert('Grades submitted successfully!');
    } catch (error) {
      console.error('Error submitting grades:', error);
      alert('Failed to submit grades');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="2000"
              max="2100"
            />
          </div>
        </div>

        {selectedCourse && students.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Student Grades</h3>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-500">ID: {student.admissionNo}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={grades[student._id] || ''}
                      onChange={(e) => handleGradeChange(student._id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Grade</option>
                      <option value="Mastery">Mastery</option>
                      <option value="Proficiency">Proficiency</option>
                      <option value="Competent">Competent</option>
                      <option value="Not Yet Competent">Not Yet Competent</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={submitGrades}
              disabled={submitting}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Grades'}
            </button>
          </div>
        )}

        {selectedCourse && students.length === 0 && (
          <p className="text-gray-500">No students enrolled in this course.</p>
        )}
      </div>
    </div>
  );
};

export default GradeManagement;
