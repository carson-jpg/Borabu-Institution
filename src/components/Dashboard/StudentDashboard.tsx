import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, coursesAPI, gradesAPI, announcementsAPI, attendanceAPI, timetablesAPI } from '../../services/api';

import CourseRegistration from '../Courses/CourseRegistration';
import TimetableView from '../Timetable/TimetableView';

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

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [studentData, setStudentData] = useState<Student | null>(null);
    const [studentCourses, setStudentCourses] = useState<{ _id: string; name: string; code: string; level: string; credits: number }[]>([]);
    const [studentGrades, setStudentGrades] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTimetable, setShowTimetable] = useState(false);
    const [currentGPA, setCurrentGPA] = useState<number>(0);
    const [attendanceRate, setAttendanceRate] = useState<number>(0);
    const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        if (user?.role === 'student') {
          try {
            // Use the new API method to get student data by user ID
            const currentStudent = await studentsAPI.getByUserId(user.id);
            setStudentData(currentStudent);

            // Fetch enrolled courses
            const coursesData = await coursesAPI.getAll();
            const enrolledCourses = coursesData.filter((c: { _id: string }) =>
              c && c._id && currentStudent.courses && currentStudent.courses.includes(c._id)
            );
            setStudentCourses(enrolledCourses);
            
            // Fetch grades
            const gradesData = await gradesAPI.getAll({ studentId: currentStudent._id });
            setStudentGrades(gradesData);

            // Calculate GPA from grades
            if (gradesData && gradesData.length > 0) {
              const totalPoints = gradesData.reduce((sum: number, grade: any) => {
                const gradePoint = grade.grade === 'A' ? 4 : grade.grade === 'B' ? 3 : grade.grade === 'C' ? 2 : grade.grade === 'D' ? 1 : 0;
                return sum + gradePoint;
              }, 0);
              const gpa = totalPoints / gradesData.length;
              setCurrentGPA(parseFloat(gpa.toFixed(2)));
            }

            // Fetch attendance data
            const attendanceData = await attendanceAPI.getAll({ studentId: currentStudent._id });
            if (attendanceData && attendanceData.length > 0) {
              const presentCount = attendanceData.filter((record: any) => record.status === 'present').length;
              const rate = (presentCount / attendanceData.length) * 100;
              setAttendanceRate(Math.round(rate));
            }

            // Fetch today's timetable
            const timetableData = await timetablesAPI.getStudentTimetable(currentStudent._id);
            if (timetableData && timetableData.entries && Array.isArray(timetableData.entries)) {
              const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
              const todayClasses = timetableData.entries.filter((entry: any) =>
                entry && entry.dayOfWeek === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today]
              );
              setUpcomingClasses(todayClasses.slice(0, 3)); // Show max 3 classes
            }
          } catch (error: any) {
            if (error.message?.includes('Access denied')) {
              console.error('Access denied - user does not have permission to view this student data');
            } else if (error.message?.includes('not found')) {
              console.error('Student record not found for this user');
            } else {
              console.error('Error fetching student data:', error);
            }
          }
        }
        
        // Fetch announcements
        const announcementsData = await announcementsAPI.getAll({ audience: 'student' });
        setAnnouncements(announcementsData);
        
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStudentData();
    }
  }, [user]);

  // Function to refresh student data (to be called after course registration)
  const refreshStudentData = async () => {
    if (user?.role === 'student') {
      try {
        const currentStudent = await studentsAPI.getByUserId(user.id);
        setStudentData(currentStudent);

        // Refresh enrolled courses
        const coursesData = await coursesAPI.getAll();
        const enrolledCourses = coursesData.filter((c: { _id: string }) =>
          c && c._id && currentStudent.courses && currentStudent.courses.includes(c._id)
        );
        setStudentCourses(enrolledCourses);
      } catch (error) {
        console.error('Error refreshing student data:', error);
      }
    }
  };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }
    
    const totalFees = studentData?.fees.reduce((sum, fee) => sum + fee.amount, 0) || 0;
    const paidFees = studentData?.fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0) || 0;
    const pendingFees = totalFees - paidFees;

    const stats = [
        {
            title: 'Enrolled Courses',
            value: studentCourses.length.toString(),
            icon: BookOpen,
            color: 'bg-blue-500'
        },
        {
            title: 'Current GPA',
            value: currentGPA > 0 ? currentGPA.toString() : 'N/A',
            icon: BarChart,
            color: 'bg-green-500'
        },
        {
            title: 'Attendance Rate',
            value: `${attendanceRate}%`,
            icon: Calendar,
            color: 'bg-purple-500'
        },
        {
            title: 'Fees Balance',
            value: `KES ${pendingFees.toLocaleString()}`,
            icon: CreditCard,
            color: pendingFees > 0 ? 'bg-red-500' : 'bg-green-500'
        }
    ];

    const recentAnnouncements = announcements
        .filter(a => a && a.targetAudience && a.targetAudience.includes('student'))
        .slice(0, 3);

    return (
        <div className="space-y-6">
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
                  {studentData && studentData._id ? (
                    <CourseRegistration studentId={studentData._id} onCourseRegistered={refreshStudentData} />
                  ) : (
                    <div className="bg-gray-100 text-gray-600 px-3 py-2 text-sm rounded-md">
                      Loading student data...
                    </div>
                  )}
                  <button 
                    className="bg-green-600 text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-md hover:bg-green-700 transition-colors"
                    onClick={() => window.location.href = '#transcript'}
                  >
                    Download Transcript
                  </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-lg shadow p-4 md:p-6">
                            <div className="flex items-center">
                                <div className={`p-2 md:p-3 rounded-md ${stat.color}`}>
                                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                                </div>
                                <div className="ml-3 md:ml-4">
                                    <h3 className="text-base md:text-lg font-medium text-gray-900">{stat.value}</h3>
                                    <p className="text-xs md:text-sm text-gray-500">{stat.title}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {pendingFees > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-yellow-800">Outstanding Fees</h3>
                            <p className="text-sm text-yellow-700">
                                You have KES {pendingFees.toLocaleString()} in outstanding fees. Please make payment to avoid any disruption.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* HELB Loan Information */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">HELB Loan Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800">Loan Amount</h4>
                        <p className="text-xl font-bold text-blue-900">KES {(studentData?.helbLoan?.amount ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800">Loan Status</h4>
                        <p className={`text-lg font-bold ${
                            studentData?.helbLoan?.status === 'disbursed' ? 'text-green-900' :
                            studentData?.helbLoan?.status === 'approved' ? 'text-blue-900' :
                            studentData?.helbLoan?.status === 'pending' ? 'text-yellow-900' :
                            'text-red-900'
                        }`}>
                            {studentData?.helbLoan?.status ? studentData.helbLoan.status.charAt(0).toUpperCase() + studentData.helbLoan.status.slice(1) : 'Not Applied'}
                        </p>
                    </div>
                </div>
                {studentData?.helbLoan?.loanNumber && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700">Loan Number</h4>
                        <p className="text-sm text-gray-900">{studentData?.helbLoan?.loanNumber}</p>
                    </div>
                )}
                {studentData?.helbLoan?.disbursementDate && (
                    <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-700">Disbursement Date</h4>
                        <p className="text-sm text-gray-900">{new Date(studentData?.helbLoan?.disbursementDate || '').toLocaleDateString()}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Today's Schedule */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 md:p-6 border-b border-gray-200">
                        <h3 className="text-base md:text-lg font-medium text-gray-900">Today's Schedule</h3>
                    </div>
                    <div className="p-4 md:p-6">
                        <div className="space-y-3 md:space-y-4">
                            {upcomingClasses.map((class_) => (
                                <div key={class_.id} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{class_.course}</h4>
                                        <p className="text-xs md:text-sm text-gray-500 truncate">{class_.type} • Room {class_.room}</p>
                                    </div>
                                    <div className="text-right ml-2">
                                        <div className="text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap">{class_.time}</div>
                                        <div className="text-xs text-green-600 whitespace-nowrap">On Time</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Grades */}
                <div className="bg-white rounded-lg shadow">
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
            </div>

            {/* Department Information */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
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

            {/* My Enrolled Courses */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <h3 className="text-base md:text-lg font-medium text-gray-900">My Enrolled Courses ({studentCourses.length})</h3>
                    <p className="text-sm text-gray-600 mt-1">Courses you are currently enrolled in for this semester</p>
                </div>
                <div className="p-4 md:p-6">
                    {studentCourses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {studentCourses.map((course) => (
                                <div key={course._id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{course.name}</h4>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                                            {course.level}
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
                            <p className="text-sm text-gray-400">Use the Course Registration button above to enroll in courses</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Announcements */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <h3 className="text-base md:text-lg font-medium text-gray-900">Recent Announcements</h3>
                </div>
                <div className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-4">
                        {recentAnnouncements.map((announcement) => (
                            <div key={announcement._id} className="p-3 md:p-4 bg-blue-50 rounded-lg">
                                <h4 className="text-sm md:text-base font-medium text-gray-900">{announcement.title}</h4>
                                <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                                <p className="text-xs text-gray-500 mt-2">{new Date(announcement.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

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
