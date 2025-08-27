import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesAPI, studentsAPI, attendanceAPI } from '../../services/api';

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

const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: string }>({});
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
    const fetchStudents = async () => {
      if (!selectedCourse) return;

      try {
        const studentsData = await studentsAPI.getAll();
        const enrolledStudents = studentsData.filter((student: any) => 
          student.courses.includes(selectedCourse)
        );
        setStudents(enrolledStudents);

        // Initialize attendance records
        const initialRecords: { [key: string]: string } = {};
        enrolledStudents.forEach((student: Student) => {
          initialRecords[student._id] = 'present';
        });
        setAttendanceRecords(initialRecords);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, [selectedCourse]);

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const submitAttendance = async () => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }

    setSubmitting(true);
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status
      }));

      await attendanceAPI.bulkRecord({
        courseId: selectedCourse,
        date: attendanceDate,
        attendanceRecords: records
      });

      alert('Attendance recorded successfully!');
    } catch (error) {
      console.error('Error recording attendance:', error);
      alert('Failed to record attendance');
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
      <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
              Attendance Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {selectedCourse && students.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Student Attendance</h3>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-500">ID: {student.admissionNo}</p>
                  </div>
                  <div className="flex space-x-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`attendance-${student._id}`}
                        value="present"
                        checked={attendanceRecords[student._id] === 'present'}
                        onChange={() => handleAttendanceChange(student._id, 'present')}
                        className="mr-2"
                      />
                      Present
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`attendance-${student._id}`}
                        value="absent"
                        checked={attendanceRecords[student._id] === 'absent'}
                        onChange={() => handleAttendanceChange(student._id, 'absent')}
                        className="mr-2"
                      />
                      Absent
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`attendance-${student._id}`}
                        value="late"
                        checked={attendanceRecords[student._id] === 'late'}
                        onChange={() => handleAttendanceChange(student._id, 'late')}
                        className="mr-2"
                      />
                      Late
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={submitAttendance}
              disabled={submitting}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Attendance'}
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

export default AttendanceManagement;
