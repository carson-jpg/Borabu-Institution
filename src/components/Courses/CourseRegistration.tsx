import React, { useEffect, useState } from 'react';
import { coursesAPI, studentsAPI } from '../../services/api';

type Course = {
    _id: string;
    name: string;
    code: string;
};

type CourseRegistrationProps = {
    studentId: string;
    onCourseRegistered?: () => void;
};

const CourseRegistration: React.FC<CourseRegistrationProps> = ({ studentId, onCourseRegistered }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await coursesAPI.getAll();
                // Ensure response is an array before setting state
                if (Array.isArray(response)) {
                    setCourses(response);
                } else {
                    setError('Invalid response format from server');
                    setCourses([]);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
                setError('Failed to fetch courses');
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleRegister = async () => {
        try {
            // Validate inputs
            if (!studentId || studentId.trim() === '') {
                alert('Student ID is missing. Please refresh the page and try again.');
                return;
            }

            if (!selectedCourse || selectedCourse.trim() === '') {
                alert('Please select a course to register.');
                return;
            }

            if (!selectedYear || selectedYear.trim() === '') {
                alert('Please select a year for the course.');
                return;
            }

            // Use the studentsAPI to add course to student with year
            console.log('Registering course with ID:', selectedCourse, 'Year:', selectedYear, 'Student ID:', studentId);
            const response = await studentsAPI.addCourse(studentId, { courseId: selectedCourse, year: parseInt(selectedYear) });
            console.log('API Response:', response);
            alert('Course registered successfully!');
            setSelectedCourse('');
            setSelectedYear('');

            // Call the callback if provided
            if (onCourseRegistered) {
                onCourseRegistered();
            }
        } catch (error) {
            console.error('Error registering course:', error);
            let errorMessage = 'Unknown error occurred';

            if (error instanceof Error) {
                errorMessage = error.message;
                // Provide more user-friendly error messages
                if (error.message.includes('Invalid student ID format')) {
                    errorMessage = 'Invalid student information. Please refresh the page and try again.';
                } else if (error.message.includes('Student not found')) {
                    errorMessage = 'Student profile not found. Please contact administrator.';
                } else if (error.message.includes('Course already enrolled')) {
                    errorMessage = 'You are already enrolled in this course.';
                } else if (error.message.includes('Server error')) {
                    errorMessage = 'Server error occurred. Please try again later.';
                }
            }

            alert(`Failed to register course: ${errorMessage}`);
        }
    };

    if (loading) {
        return <div>Loading courses...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Course Registration</h2>
            <div className="flex gap-2">
                <select
                    onChange={(e) => setSelectedYear(e.target.value)}
                    value={selectedYear}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Year</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                </select>
                <select
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    value={selectedCourse}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                        <option key={course._id} value={course._id}>
                            {course.name} ({course.code})
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleRegister}
                    disabled={!selectedCourse || !selectedYear}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Register
                </button>
            </div>
        </div>
    );
};

export default CourseRegistration;
