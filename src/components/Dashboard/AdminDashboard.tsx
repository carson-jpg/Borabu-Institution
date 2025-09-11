import React from 'react';
import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Building, AlertTriangle, FileText } from 'lucide-react';
import { departmentsAPI, coursesAPI, usersAPI, studentsAPI, paymentsAPI, announcementsAPI, gradesAPI } from '../../services/api';
import TranscriptUpload from '../Transcripts/TranscriptUpload';
import FeeManagement from '../Fees/FeeManagement';
import TimetableManagement from '../Timetable/TimetableManagement';

// Define types for departments, courses, users, and students
interface Department {
  _id: string;
  name: string;
  programs?: any[];
  studentCount: number;
  courseCount: number;
}

interface User {
  _id: string;
  role: string;
}

interface Student {
  _id: string;
  departmentId: string;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'enrollment' | 'grade' | 'payment' | 'announcement';
}

const AdminDashboard: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, courseData, userData, studentData, paymentData, announcementData, gradeData] = await Promise.all([
          departmentsAPI.getAll(),
          coursesAPI.getAll(),
          usersAPI.getAll(),
          studentsAPI.getAll(),
          paymentsAPI.getAllPayments({ limit: 5, sort: '-createdAt' }).catch(() => ({ payments: [] })),
          announcementsAPI.getAll({ limit: 5, sort: '-createdAt' }).catch(() => []),
          gradesAPI.getAll({ limit: 5, sort: '-createdAt' }).catch(() => []),
          Promise.resolve([]) // Placeholder for timetables - not used in current dashboard
        ]);

        setDepartments(deptData);
        setCourses(courseData);
        setUsers(userData);
        setStudents(studentData);

        // Create recent activities from real data
        const activities: RecentActivity[] = [];

        // Add recent payments
        if (paymentData.payments) {
          paymentData.payments.slice(0, 2).forEach((payment: any) => {
            activities.push({
              id: `payment-${payment._id}`,
              action: `Fee payment received - KES ${payment.amount}`,
              user: payment.student?.name || 'Unknown Student',
              time: formatTimeAgo(new Date(payment.createdAt)),
              type: 'payment'
            });
          });
        }

        // Add recent enrollments
        studentData.slice(-2).forEach((student: any) => {
          activities.push({
            id: `enrollment-${student._id}`,
            action: 'New student enrollment',
            user: student.userId?.name || student.name || 'Unknown Student',
            time: formatTimeAgo(new Date(student.createdAt || Date.now())),
            type: 'enrollment'
          });
        });

        // Add recent grades
        if (Array.isArray(gradeData)) {
          gradeData.slice(0, 2).forEach((grade: any) => {
            activities.push({
              id: `grade-${grade._id}`,
              action: 'Course grade updated',
              user: grade.student?.name || 'Unknown Student',
              time: formatTimeAgo(new Date(grade.createdAt || Date.now())),
              type: 'grade'
            });
          });
        }

        // Add recent announcements
        if (Array.isArray(announcementData)) {
          announcementData.slice(0, 2).forEach((announcement: any) => {
            activities.push({
              id: `announcement-${announcement._id}`,
              action: 'New announcement posted',
              user: announcement.author?.name || 'Admin',
              time: formatTimeAgo(new Date(announcement.createdAt || Date.now())),
              type: 'announcement'
            });
          });
        }

        // Sort activities by time (most recent first)
        activities.sort((a, b) => {
          const timeA = parseTimeAgo(a.time);
          const timeB = parseTimeAgo(b.time);
          return timeA - timeB;
        });

        setRecentActivities(activities.slice(0, 6)); // Keep only 6 most recent
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Helper function to parse time ago for sorting
  const parseTimeAgo = (timeAgo: string): number => {
    if (timeAgo === 'Just now') return 0;
    if (timeAgo.includes('hours ago')) return parseInt(timeAgo) * 60 * 60 * 1000;
    if (timeAgo.includes('days ago')) return parseInt(timeAgo) * 24 * 60 * 60 * 1000;
    return Date.now(); // Default to now for other formats
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Students',
      value: students.length.toString(),
      icon: GraduationCap,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Courses',
      value: courses.length.toString(),
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      title: 'Departments',
      value: departments.length.toString(),
      icon: Building,
      color: 'bg-purple-500'
    },
    {
      title: 'Staff Members',
      value: users.filter(u => u.role === 'teacher').length.toString(),
      icon: Users,
      color: 'bg-orange-500'
    }
  ];



  const departmentStats = departments.map(dept => ({
    ...dept,
    studentCount: students.filter((s: any) => {
      if (!s.departmentId) return false;
      if (typeof s.departmentId === 'string') return s.departmentId === dept._id;
      if (typeof s.departmentId === 'object' && s.departmentId._id) return s.departmentId._id === dept._id;
      return false;
    }).length,
    courseCount: courses.filter((c: any) => {
      if (!c.departmentId) return false;
      if (typeof c.departmentId === 'string') return c.departmentId === dept._id;
      if (typeof c.departmentId === 'object' && c.departmentId._id) return c.departmentId._id === dept._id;
      return false;
    }).length
  })).filter(dept => dept !== null && dept !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2">
          <button className="bg-green-600 text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-md hover:bg-green-700 transition-colors">
            Generate Report
          </button>
          <button className="bg-blue-600 text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-md hover:bg-blue-700 transition-colors">
            Add User
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Department Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-medium text-gray-900">Department Overview</h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {departmentStats.length > 0 ? (
                departmentStats.slice(0, 6).map((dept) => (
                  <div key={dept?._id || Math.random()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{dept?.name || 'Unknown Department'}</h4>
                      <p className="text-xs md:text-sm text-gray-500 truncate">{dept?.programs ? `${dept.programs.length} programs` : 'No programs'}</p>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap">{dept?.studentCount || 0} students</div>
                      <div className="text-xs md:text-sm text-gray-500 whitespace-nowrap">{dept?.courseCount || 0} courses</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm md:text-base">No departments available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-medium text-gray-900">Recent Activities</h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-3 md:space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${
                    activity.type === 'enrollment' ? 'bg-blue-100' :
                    activity.type === 'grade' ? 'bg-green-100' :
                    activity.type === 'payment' ? 'bg-yellow-100' : 'bg-purple-100'
                  }`}>
                    {activity.type === 'enrollment' && <GraduationCap className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'grade' && <BookOpen className="h-4 w-4 text-green-600" />}
                    {activity.type === 'payment' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    {activity.type === 'announcement' && <Users className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                    <p className="text-xs md:text-sm text-gray-500 truncate">by {activity.user}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <button className="p-3 md:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Building className="h-5 w-5 md:h-6 md:w-6 text-gray-400 mx-auto mb-1 md:mb-2" />
            <span className="text-xs md:text-sm font-medium text-gray-700">Add Department</span>
          </button>
          <button className="p-3 md:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-gray-400 mx-auto mb-1 md:mb-2" />
            <span className="text-xs md:text-sm font-medium text-gray-700">Create Course</span>
          </button>
          <button className="p-3 md:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-gray-400 mx-auto mb-1 md:mb-2" />
            <span className="text-xs md:text-sm font-medium text-gray-700">Manage Users</span>
          </button>
          <button className="p-3 md:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-gray-400 mx-auto mb-1 md:mb-2" />
            <span className="text-xs md:text-sm font-medium text-gray-700">Upload Transcript</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">Fee Management</h3>
        <FeeManagement />
      </div>

      {/* Transcript Upload Section */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">Transcript Management</h3>
        <TranscriptUpload />
      </div>

      {/* Timetable Management Section */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">Timetable Management</h3>
        <TimetableManagement />
      </div>
    </div>
  );
};

export default AdminDashboard;
