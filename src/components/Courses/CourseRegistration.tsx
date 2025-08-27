import React, { useEffect, useState } from 'react';
import { coursesAPI, studentsAPI } from '../../services/api';

type Course = {
    _id: string;
    name: string;
    code: string;
};

type CourseRegistrationProps = {
    studentId: string;
};

const CourseRegistration: React.FC<CourseRegistrationProps> = ({ studentId }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
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
            // Use the studentsAPI to add course to student
            console.log('Registering course with ID:', selectedCourse); // Log the selected course ID
            const response = await studentsAPI.addCourse(studentId, { courseId: selectedCourse });
            console.log('API Response:', response); // Log the response
            console.log('API Response:', response); // Log the response
            alert('Course registered successfully!');
            setSelectedCourse('');
        } catch (error) {
            console.error('Error registering course:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to register course: ${errorMessage}`); // Log the error message
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
                    disabled={!selectedCourse}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Register
                </button>
            </div>
        </div>
    );
};

export default CourseRegistration;
