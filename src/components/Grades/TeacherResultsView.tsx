import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gradesAPI } from '../../services/api';

interface Student {
  _id: string;
  name: string;
  admissionNo: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface Grade {
  _id: string;
  studentId: Student;
  courseId: Course;
  grade: string;
  semester: number;
  year: number;
  createdAt: string;
}

const TeacherResultsView: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const gradesData = await gradesAPI.getAll({ teacherEmail: user?.email });
        setGrades(gradesData);
      } catch (error) {
        console.error('Error fetching grades:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGrades();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Results</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {grades.length > 0 ? (
          grades.map((grade) => (
            <div key={grade._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{grade.studentId.name}</h4>
                <p className="text-sm text-gray-500">{grade.courseId.name}</p>
              </div>
              <div className="text-lg font-bold text-green-600">{grade.grade}</div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No grades available.</p>
        )}
      </div>
    </div>
  );
};

export default TeacherResultsView;
