import React, { useState, useEffect, Suspense } from 'react';
import { BookOpen, BarChart, Calendar, CreditCard, AlertTriangle, FileText, MessageSquare, Users, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, coursesAPI, gradesAPI, announcementsAPI, attendanceAPI, timetablesAPI, assignmentsAPI, feedbackAPI, materialsAPI } from '../../services/api';

import CourseRegistration from '../Courses/CourseRegistration';
import TimetableView from '../Timetable/TimetableView';
import TranscriptDownload from '../Transcripts/TranscriptDownload';

interface Student {
    _id: string;
    admissionNo: string;
    userId: { _id: string; name: string; email: string };
    departmentId: { _id: string; name: string; description?: string } | string;
    courses: { _id: string; name: string; code: string; level: string; credits: number }[];
    fees: { amount: number; status: string; dueDate: Date; description: string; paidDate?: Date }[];
    helbLoan: {
        amount: number;
        status: string;
        applicationDate?: Date;
        disbursementDate?: Date;
        loanNumber?: string;
    };
    year: number;
}

interface StudentDashboardProps {
    activeTab?: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab = 'dashboard' }) => {
    const { user } = useAuth();
    const [currentTab, setCurrentTab] = useState<string>(activeTab || 'dashboard');
    const [studentData, setStudentData] = useState<Student | null>(null);
const [studentCourses, setStudentCourses] = useState<{ _id: string; name: string; code: string; level: string; credits: number }[]>([]);
const [filteredStudentCourses, setFilteredStudentCourses] = useState<{ _id: string; name: string; code: string; level: string; credits: number }[]>([]);
const [departmentCourses, setDepartmentCourses] = useState<{ _id: string; name: string; code: string; level: string; credits: number; teacherId?: any }[]>([]);
    const [studentGrades, setStudentGrades] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTimetable, setShowTimetable] = useState(false);
    const [currentGPA, setCurrentGPA] = useState<number>(0);
    const [attendanceRate, setAttendanceRate] = useState<number>(0);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
    const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
    const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                if (user?.role === 'student') {
                    try {
                        // Use the new API method to get student data by user ID
                        const currentStudent = await studentsAPI.getByUserId(user.id);
                        setStudentData(currentStudent);

        // Set enrolled courses from student data
        setStudentCourses(currentStudent.courses || []);

        // Fetch department courses taught by teachers in student's department
        if (typeof currentStudent.departmentId === 'object' && currentStudent.departmentId._id) {
            // Use coursesAPI.getAll with department filter instead of non-existent getByDepartment
            const deptCourses = await coursesAPI.getAll({ departmentId: currentStudent.departmentId._id });
            setDepartmentCourses(deptCourses);

            // Filter studentCourses to only those in departmentCourses
            const deptCourseIds = new Set(deptCourses.map((course: { _id: string }) => course._id));
            const filteredCourses = (currentStudent.courses || []).filter((course: { _id: string }) => deptCourseIds.has(course._id));
            setFilteredStudentCourses(filteredCourses);
        }

        // Fetch grades
        const gradesData = await gradesAPI.getAll({ studentId: currentStudent._id });
        setStudentGrades(gradesData);

        // Calculate GPA
        if (gradesData.length > 0) {
            const totalPoints = gradesData.reduce((sum: number, grade: any) => {
                const points = grade.grade === 'A' ? 4 : grade.grade === 'B' ? 3 : grade.grade === 'C' ? 2 : grade.grade === 'D' ? 1 : 0;
                return sum + points;
            }, 0);
            setCurrentGPA(Math.round((totalPoints / gradesData.length) * 100) / 100);
        }

        // Fetch announcements
        const announcementsData = await announcementsAPI.getAll();
        setAnnouncements(announcementsData);

        // Fetch attendance data
        const attendanceData = await attendanceAPI.getAll({ studentId: currentStudent._id });
        setAttendanceRecords(attendanceData);
        if (attendanceData && attendanceData.length > 0) {
            const presentCount = attendanceData.filter((record: any) => record.status === 'present').length;
            const rate = (presentCount / attendanceData.length) * 100;
            setAttendanceRate(Math.round(rate));
        }

        // Fetch upcoming classes (timetable)
        const timetableData = await timetablesAPI.getStudentTimetable(currentStudent._id);
        setUpcomingClasses(timetableData);

        // Fetch pending assignments
        const assignmentsData = await assignmentsAPI.getAll();
        const pending = assignmentsData.filter((assignment: any) =>
            assignment.courseId && currentStudent.courses.some((course: any) => course._id === assignment.courseId._id) &&
            new Date(assignment.dueDate) > new Date()
        );
        setPendingAssignments(pending);

        // Fetch recent feedback
        const feedbackData = await feedbackAPI.getForStudent();
        setRecentFeedback(feedbackData.slice(0, 3));

        // Fetch materials for student's courses
        const materialsPromises = currentStudent.courses.map((course: any) => materialsAPI.getByCourse(course._id));
        const materialsArrays = await Promise.all(materialsPromises);
        const studentMaterials = materialsArrays.flat();
        setMaterials(studentMaterials);

                    } catch (error) {
                        console.error('Error fetching student data:', error);
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error('Error in fetchStudentData:', error);
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [user]);

    const refreshStudentData = () => {
        // Refresh function for after course registration
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const stats = [
        { label: 'Current GPA', value: currentGPA.toFixed(2), icon: BarChart, color: 'text-blue-600' },
        { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: Calendar, color: 'text-green-600' },
        { label: 'Enrolled Courses', value: studentCourses.length.toString(), icon: BookOpen, color: 'text-purple-600' },
        { label: 'Pending Assignments', value: pendingAssignments.length.toString(), icon: AlertTriangle, color: 'text-red-600' }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                    <p className="text-sm md:text-base text-gray-600">Admission No: {studentData?.admissionNo}</p>
                    <p className="text-sm md:text-base text-gray-600">Year of Study: {studentData?.year}</p>
                    <p className="text-sm md:text-base text-gray-600">Department: {typeof studentData?.departmentId === 'object' && studentData.departmentId?.name ? studentData.departmentId.name : 'Not Assigned'}</p>
                </div>
                <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2">
                    <button
                        onClick={() => setShowTimetable(true)}
                        className="bg-blue-600 text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-md hover:bg-blue-700 transition-colors"
                    >
                        View Timetable
                    </button>
                    <button
                        className="bg-green-600 text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-md hover:bg-green-700 transition-colors"
                        onClick={() => setCurrentTab('transcript')}
                    >
                        View Transcript
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mt-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: BarChart },
                        { id: 'courses', label: 'My Courses', icon: BookOpen },
                        { id: 'grades', label: 'Grades', icon: FileText },
                        { id: 'attendance', label: 'Attendance', icon: Calendar },
                        { id: 'fees', label: 'Fees', icon: CreditCard },
                        { id: 'announcements', label: 'Announcements', icon: Bell },
                        { id: 'transcript', label: 'Transcript', icon: FileText }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setCurrentTab(tab.id)}
                                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                                    currentTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Dashboard Tab */}
            {currentTab === 'dashboard' && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="bg-white rounded-lg shadow p-4 md:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm md:text-base font-medium text-gray-600">{stat.label}</p>
                                            <p className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
                                        </div>
                                        <Icon className={`h-6 w-6 md:h-8 md:w-8 ${stat.color}`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* HELB Loan Status */}
                    {studentData?.helbLoan && (
                        <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">HELB Loan Status</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-lg font-semibold text-blue-900">Loan Amount: KES {studentData.helbLoan.amount.toLocaleString()}</h4>
                                        <p className="text-sm text-blue-700">Status: <span className={`font-medium ${studentData.helbLoan.status === 'approved' ? 'text-green-600' : studentData.helbLoan.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>{studentData.helbLoan.status}</span></p>
                                        {studentData.helbLoan.disbursementDate && (
                                            <p className="text-sm text-blue-700">Disbursed: {new Date(studentData.helbLoan.disbursementDate).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        {studentData.helbLoan.loanNumber && (
                                            <p className="text-sm text-blue-600">Loan No: {studentData.helbLoan.loanNumber}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fees Warning */}
                    {studentData?.fees.some(fee => fee.status === 'pending') && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                            <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-800">Outstanding Fees</h4>
                                    <p className="text-sm text-yellow-700">You have pending fees that need to be paid.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Today's Schedule */}
                    <div className="bg-white rounded-lg shadow mt-6">
                        <div className="p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-medium text-gray-900">Today's Schedule</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="space-y-3 md:space-y-4">
                                {upcomingClasses.slice(0, 3).map((classItem) => (
                                    <div key={classItem._id} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{classItem.courseId?.name || 'Unknown Course'}</h4>
                                            <p className="text-xs md:text-sm text-gray-500">{classItem.day} • {classItem.startTime} - {classItem.endTime}</p>
                                        </div>
                                        <div className="text-right ml-2">
                                            <div className="text-sm font-bold text-blue-600 whitespace-nowrap">{classItem.room || 'TBA'}</div>
                                        </div>
                                    </div>
                                ))}
                                {upcomingClasses.length === 0 && (
                                    <p className="text-gray-500 text-center">No classes scheduled for today</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Department Information */}
                    <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Information</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-lg font-semibold text-blue-900">
                                        {typeof studentData?.departmentId === 'object' && studentData.departmentId?.name
                                            ? studentData.departmentId.name
                                            : 'Department Not Assigned'}
                                    </h4>
                                    {typeof studentData?.departmentId === 'object' && studentData.departmentId?.description && (
                                        <p className="text-sm text-blue-700 mt-1">{studentData.departmentId.description}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-blue-600">Year {studentData?.year || 'N/A'}</p>
                                    <p className="text-sm text-blue-600">Semester {studentData?.year ? (studentData.year * 2) - 1 : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Assignments */}
                    <div className="bg-white rounded-lg shadow mt-6">
                        <div className="p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-medium text-gray-900">Pending Assignments</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="space-y-3 md:space-y-4">
                                {pendingAssignments.slice(0, 3).map((assignment) => (
                                    <div key={assignment._id} className="p-3 md:p-4 bg-yellow-50 rounded-lg">
                                        <h4 className="text-sm md:text-base font-medium text-gray-900">{assignment.title}</h4>
                                        <p className="text-xs md:text-sm text-gray-600 mt-1">{assignment.courseId?.name}</p>
                                        <p className="text-xs text-gray-500 mt-2">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                                    </div>
                                ))}
                                {pendingAssignments.length === 0 && (
                                    <p className="text-gray-500 text-center">No pending assignments</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Feedback */}
                    <div className="bg-white rounded-lg shadow mt-6">
                        <div className="p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-medium text-gray-900">Recent Feedback</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="space-y-3 md:space-y-4">
                                {recentFeedback.slice(0, 3).map((feedback) => (
                                    <div key={feedback._id} className="p-3 md:p-4 bg-green-50 rounded-lg">
                                        <h4 className="text-sm md:text-base font-medium text-gray-900">{feedback.courseId?.name}</h4>
                                        <p className="text-xs md:text-sm text-gray-600 mt-1">{feedback.content}</p>
                                        <p className="text-xs text-gray-500 mt-2">From: {feedback.teacherId?.name} • {new Date(feedback.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                                {recentFeedback.length === 0 && (
                                    <p className="text-gray-500 text-center">No recent feedback</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Course Materials */}
                    <div className="bg-white rounded-lg shadow mt-6">
                        <div className="p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-medium text-gray-900">Course Materials</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="space-y-3 md:space-y-4">
                                {materials.slice(0, 5).map((material) => (
                                    <div key={material._id} className="p-3 md:p-4 bg-purple-50 rounded-lg">
                                        <h4 className="text-sm md:text-base font-medium text-gray-900">{material.title}</h4>
                                        <p className="text-xs md:text-sm text-gray-600 mt-1">{material.courseId?.name}</p>
                                        <p className="text-xs text-gray-500 mt-2">Uploaded: {new Date(material.createdAt).toLocaleDateString()}</p>
                                        <button className="mt-2 text-blue-600 hover:text-blue-800 text-xs">Download</button>
                                    </div>
                                ))}
                                {materials.length === 0 && (
                                    <p className="text-gray-500 text-center">No materials available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Courses Tab */}
            {currentTab === 'courses' && (
                <>
                    {/* Course Registration */}
                    <div className="mt-6 mb-6">
                        {studentData && studentData._id && typeof studentData.departmentId === 'object' && studentData.departmentId._id ? (
                            <CourseRegistration
                                studentId={studentData._id}
                                departmentId={studentData.departmentId._id}
                                onCourseRegistered={refreshStudentData}
                            />
                        ) : (
                            <div className="bg-gray-100 text-gray-600 px-3 py-2 text-sm rounded-md">
                              Loading student data...
                            </div>
                        )}
                    </div>

                    {/* My Enrolled Courses */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-medium text-gray-900">My Enrolled Courses ({filteredStudentCourses.length})</h3>
                            <p className="text-sm text-gray-600 mt-1">Courses you are currently enrolled in for this semester</p>
                        </div>
                        <div className="p-4 md:p-6">
                            {filteredStudentCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                    {filteredStudentCourses.map((course) => (
                                        <div key={course._id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{course.name}</h4>
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">
                                                    Enrolled
                                                </span>
                                            </div>
                                            <p className="text-xs md:text-sm text-gray-500 mb-2 truncate">Code: {course.code}</p>
                                            <p className="text-xs md:text-sm text-gray-500">{course.credits} Credits</p>
                                            <div className="mt-3 md:mt-4 flex space-x-2">
                                                <button className="flex-1 bg-blue-100 text-blue-700 py-1 px-2 md:px-3 rounded text-xs md:text-sm hover:bg-blue-200 transition-colors">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No courses enrolled yet</p>
                                    <p className="text-sm text-gray-400">Use the Course Registration above to enroll in courses</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Department Courses */}
                    <div className="bg-white rounded-lg shadow mt-6">
                        <div className="p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-medium text-gray-900">Department Courses ({departmentCourses.length})</h3>
                            <p className="text-sm text-gray-600 mt-1">All courses available in your department taught by teachers</p>
                        </div>
                        <div className="p-4 md:p-6">
                            {departmentCourses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                    {departmentCourses.map((course: { _id: string; name: string; code: string; level: string; credits: number; teacherId?: any }) => {
                                        const isEnrolled = studentCourses.some(sc => sc._id === course._id);
                                        return (
                                            <div key={course._id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{course.name}</h4>
                                                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                                        isEnrolled
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {isEnrolled ? 'Enrolled' : 'Available'}
                                                    </span>
                                                </div>
                                                <p className="text-xs md:text-sm text-gray-500 mb-2 truncate">Code: {course.code}</p>
                                                <p className="text-xs md:text-sm text-gray-500">{course.credits} Credits</p>
                                                {course.teacherId && (
                                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                                        Teacher: {course.teacherId.name || 'Unknown'}
                                                    </p>
                                                )}
                            <div className="mt-3 md:mt-4 flex space-x-2">
                                <button className="flex-1 bg-blue-100 text-blue-700 py-1 px-2 md:px-3 rounded text-xs md:text-sm hover:bg-blue-200 transition-colors">
                                    View Details
                                </button>
                                {!isEnrolled && studentData && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                console.log('Attempting to enroll student:', studentData._id, 'in course:', course._id);
                                                console.log('Course details:', course);
                                                console.log('Student details:', studentData);

                                                // Call the API with studentId in the body as an object
                                                const result = await coursesAPI.registerStudent(course._id, studentData._id);
                                                console.log('Enrollment result:', result);

                                                // Refresh the page to update the enrolled courses
                                                window.location.reload();
                                            } catch (error) {
                                                console.error('Error enrolling in course:', error);
                                                console.error('Error details:', error instanceof Error ? error.message : String(error));
                                                alert('Failed to enroll in course. Please try again.');
                                            }
                                        }}
                                        className="flex-1 bg-green-100 text-green-700 py-1 px-2 md:px-3 rounded text-xs md:text-sm hover:bg-green-200 transition-colors"
                                    >
                                        Enroll
                                    </button>
                                )}
                            </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No courses available in your department</p>
                                    <p className="text-sm text-gray-400">Courses will be shown here once they are assigned to teachers in your department</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Grades Tab */}
            {currentTab === 'grades' && (
                <>
                    {/* Recent Grades */}
                    <div className="bg-white rounded-lg shadow mt-6">
                        <div className="p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-medium text-gray-900">Recent Grades</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="space-y-3 md:space-y-4">
                                {studentGrades.map((grade) => (
                                    <div key={grade._id} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{grade.courseId?.name || 'Unknown Course'}</h4>
                                            <p className="text-xs md:text-sm text-gray-500">Semester {grade.semester || 'N/A'}, {grade.year || 'N/A'}</p>
                                        </div>
                                        <div className="text-right ml-2">
                                            <div className="text-base md:text-lg font-bold text-green-600 whitespace-nowrap">{grade.grade || 'N/A'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Attendance Tab */}
            {currentTab === 'attendance' && (
                <>
                    {/* Attendance Information */}
                    <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-800">Attendance Rate</h4>
                                <p className="text-2xl font-bold text-blue-900">{attendanceRate}%</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-green-800">Total Sessions</h4>
                                <p className="text-xl font-bold text-green-900">{attendanceRecords.length}</p>
                            </div>
                        </div>
                    </div>
                    {/* Attendance Records */}
                    <div className="bg-white rounded-lg shadow mt-6">
                        <div className="p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-medium text-gray-900">Attendance Records</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="space-y-3 md:space-y-4">
                                {attendanceRecords.slice(0, 10).map((record) => (
                                    <div key={record._id} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{record.courseId?.name || 'Unknown Course'}</h4>
                                            <p className="text-xs md:text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right ml-2">
                                            <div className={`text-sm font-bold whitespace-nowrap ${
                                                record.status === 'present' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {record.status === 'present' ? 'Present' : 'Absent'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {attendanceRecords.length === 0 && (
                                    <p className="text-gray-500 text-center">No attendance records available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Fees Tab */}
            {currentTab === 'fees' && (
                <>
                    {/* Fees Information */}
                    <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Fees Overview</h3>
                        <div className="space-y-4">
                            {studentData?.fees && studentData.fees.length > 0 ? (
                                studentData.fees.map((fee, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900">{fee.description}</h4>
                                                <p className="text-sm text-gray-600">Amount: KES {fee.amount.toLocaleString()}</p>
                                                <p className="text-sm text-gray-600">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-sm font-bold ${
                                                    fee.status === 'paid' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {fee.status === 'paid' ? 'Paid' : 'Pending'}
                                                </span>
                                                {fee.paidDate && (
                                                    <p className="text-xs text-gray-500">Paid: {new Date(fee.paidDate).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center">No fees information available</p>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Announcements Tab */}
            {currentTab === 'announcements' && (
                <>
                    {/* Recent Announcements */}
                    <div className="bg-white rounded-lg shadow mt-6">
                        <div className="p-4 md:p-6 border-b border-gray-200">
                            <h3 className="text-base md:text-lg font-medium text-gray-900">Recent Announcements</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <div className="space-y-3 md:space-y-4">
                                {announcements.map((announcement) => (
                                    <div key={announcement._id} className="p-3 md:p-4 bg-blue-50 rounded-lg">
                                        <h4 className="text-sm md:text-base font-medium text-gray-900">{announcement.title}</h4>
                                        <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                                        <p className="text-xs text-gray-500 mt-2">{new Date(announcement.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Transcript Tab */}
            {currentTab === 'transcript' && (
                <>
                    <div className="mt-6">
                        <Suspense fallback={<div>Loading Transcript...</div>}>
                            <TranscriptDownload />
                        </Suspense>
                    </div>
                </>
            )}

            {/* Timetable Modal */}
            <TimetableView
                studentId={studentData?._id || ''}
                isOpen={showTimetable}
                onClose={() => setShowTimetable(false)}
            />
        </div>
    );
};

export default StudentDashboard;
