import React, { useState, useEffect } from 'react';
import { coursesAPI } from '../../services/api';

interface Course {
  _id: string;
  name: string;
  code: string;
  level: string;
  credits: number;
  departmentId: { _id: string; name: string };
  teacherId?: { _id: string; name: string };
  isActive: boolean;
}

interface CourseRegistrationProps {
  studentId: string;
  departmentId?: string;
  onCourseRegistered: () => void;
}

const CourseRegistration: React.FC<CourseRegistrationProps> = ({ studentId, departmentId, onCourseRegistered }) => {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(1);

  useEffect(() => {
    fetchAvailableCourses();
  }, []);

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true);
      const courses = await coursesAPI.getAll();
      setAvailableCourses(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleRegister = async () => {
    if (selectedCourses.length === 0) return;

    if (!selectedYear || selectedYear < 1 || selectedYear > 4) {
      alert('Please select a valid year (1-4) before registering.');
      return;
    }

    try {
      setRegistering(true);
      for (const courseId of selectedCourses) {
        await coursesAPI.registerStudent(courseId, studentId, selectedYear);
      }
      setSelectedCourses([]);
      onCourseRegistered();
      alert('Courses registered successfully!');
    } catch (error) {
      console.error('Error registering courses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Detailed error:', errorMessage);
      alert(`Error registering courses: ${errorMessage}. Please try again.`);
    } finally {
      setRegistering(false);
    }
  };

  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === '' || course.level === selectedLevel;
    const matchesDepartment = !departmentId || course.departmentId._id === departmentId;
    return matchesSearch && matchesLevel && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Course Registration</h3>

      {/* Search and Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Levels</option>
          <option value="Artisan">Artisan</option>
          <option value="Certificate">Certificate</option>
          <option value="Diploma">Diploma</option>
        </select>
      </div>

      {/* Year Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Year of Study</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>Year 1</option>
          <option value={2}>Year 2</option>
          <option value={3}>Year 3</option>
          <option value={4}>Year 4</option>
        </select>
      </div>

      {/* Course List */}
      <div className="space-y-3 mb-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div key={course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{course.name}</h4>
                <p className="text-xs text-gray-500">Code: {course.code} - Level: {course.level} - Credits: {course.credits}</p>
                <p className="text-xs text-gray-500">Department: {course.departmentId?.name}</p>
                {course.teacherId && (
                  <p className="text-xs text-gray-500">Teacher: {course.teacherId.name}</p>
                )}
              </div>
              <input
                type="checkbox"
                checked={selectedCourses.includes(course._id)}
                onChange={() => handleCourseSelection(course._id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No courses found</p>
            <p className="text-sm text-gray-400">Try adjusting your search filters.</p>
          </div>
        )}
      </div>

      {/* Register Button */}
      {selectedCourses.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleRegister}
            disabled={registering}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {registering ? 'Registering...' : `Register ${selectedCourses.length} Course${selectedCourses.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseRegistration;
