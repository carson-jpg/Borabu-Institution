import React from 'react';
import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Building, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { departmentsAPI, coursesAPI, usersAPI, studentsAPI } from '../../services/api';
import TranscriptUpload from '../Transcripts/TranscriptUpload';
import FeeManagement from '../Fees/FeeManagement'; // Add this line

// Define types for departments, courses, users, and students
interface Department {
  _id: string;
  name: string;
  description: string;
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

const AdminDashboard: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, courseData, userData, studentData] = await Promise.all([
          departmentsAPI.getAll(),
          coursesAPI.getAll(),
          usersAPI.getAll(),
          studentsAPI.getAll()
        ]);
        
        setDepartments(deptData);
        setCourses(courseData);
        setUsers(userData);
        setStudents(studentData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Courses',
      value: courses.length.toString(),
      icon: BookOpen,
      color: 'bg-green-500',
      change: '+3%'
    },
    {
      title: 'Departments',
      value: departments.length.toString(),
      icon: Building,
      color: 'bg-purple-500',
      change: '0%'
    },
    {
      title: 'Staff Members',
      value: users.filter(u => u.role === 'teacher').length.toString(),
      icon: Users,
      color: 'bg-orange-500',
      change: '+8%'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'New student enrollment', user: 'John Doe', time: '2 hours ago', type: 'enrollment' },
    { id: 2, action: 'Course grade updated', user: 'Dr. Sarah Kimani', time: '4 hours ago', type: 'grade' },
    { id: 3, action: 'Fee payment received', user: 'Jane Smith', time: '6 hours ago', type: 'payment' },
    { id: 4, action: 'New announcement posted', user: 'Admin User', time: '1 day ago', type: 'announcement' }
  ];

  const departmentStats = departments.map(dept => ({
    ...dept,
    studentCount: students.filter(s => s.departmentId === dept._id).length,
    courseCount: courses.filter(c => c.departmentId === dept._id).length
  }));

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
              <div className="mt-3 md:mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs md:text-sm font-medium text-green-600">{stat.change}</span>
                <span className="text-xs md:text-sm text-gray-500 ml-1">from last month</span>
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
                  <div key={dept._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{dept.name}</h4>
                      <p className="text-xs md:text-sm text-gray-500 truncate">{dept.description}</p>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap">{dept.studentCount} students</div>
                      <div className="text-xs md:text-sm text-gray-500 whitespace-nowrap">{dept.courseCount} courses</div>
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
    </div>
  );
};

export default AdminDashboard;
