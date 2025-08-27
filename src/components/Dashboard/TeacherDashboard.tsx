import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, BarChart, Clock, CheckCircle, Building } from 'lucide-react';
import { coursesAPI, studentsAPI, gradesAPI, attendanceAPI, departmentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  interface Department {
    _id: string;
    name: string;
    description: string;
  }

  interface Course {
    _id: string;
    name: string;
    code: string;
    level: string;
    credits: number;
  }

  interface Student {
    _id: string;
    name: string;
    admissionNo: string;
  }

  interface Attendance {
    studentId: Student;
    courseId: Course;
    date: Date;
    status: string;
    remarks?: string;
  }

  interface Grade {
    studentId: Student;
    courseId: Course;
    grade: string;
    semester: number;
    year: number;
    remarks?: string;
    createdAt: string;
  }

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log('Fetching departments...');
        const departmentsData = await departmentsAPI.getAll();
        console.log('Departments data:', departmentsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // Get all courses, optionally filtered by department
        const courseParams: any = {};
        if (selectedDepartment) {
          courseParams.department = selectedDepartment;
        }
        
        console.log('Fetching courses with params:', courseParams);
        const coursesData = await coursesAPI.getAll(courseParams);
        console.log('Courses data received:', coursesData);
        setTeacherCourses(coursesData);
        
        // Get students enrolled in teacher's courses
        console.log('Fetching students...');
        const studentsData = await studentsAPI.getAll();
        console.log('Students data received:', studentsData);
        const enrolledStudents = studentsData.filter((s: any) => 
          s.courses.some((courseId: string) => coursesData.some((tc: any) => tc._id === courseId))
        );
        console.log('Enrolled students:', enrolledStudents);
        setTeacherStudents(enrolledStudents);
        
        // Fetch attendance records
        console.log('Fetching attendance records...');
        const attendanceData = await attendanceAPI.getAll({ courseId: coursesData.map((course: any) => course._id) });
        console.log('Attendance data received:', attendanceData);
        setAttendanceRecords(attendanceData);

        // Fetch grades
        console.log('Fetching grades...');
        const gradesData = await gradesAPI.getAll({ courseId: coursesData.map((course: any) => course._id) });
        console.log('Grades data received:', gradesData);
        setGrades(gradesData);

        // Fetch upcoming classes
        console.log('Fetching upcoming classes...');
        const classesData = await attendanceAPI.getUpcomingClasses({ teacherEmail: user?.email });
        console.log('Upcoming classes data received:', classesData);
        setUpcomingClasses(classesData);
        
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTeacherData();
    }
  }, [user, selectedDepartment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'My Courses',
      value: teacherCourses.length.toString(),
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Students',
      value: teacherStudents.length.toString(),
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Graded This Week',
      value: grades.length.toString(),
      icon: CheckCircle,
      color: 'bg-purple-500'
    },
    {
      title: 'Pending Grades',
      value: '3', // This can be updated based on your logic
      icon: Clock,
      color: 'bg-orange-500'
    }
  ];

  const recentGrades = grades.slice(0, 3); // Show only the first 3 grades

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-gray-600">Here's what's happening in your classes today.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => window.location.href = '#attendance'}
          >
            Take Attendance
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Grade Assignment
          </button>
          <button 
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            onClick={() => window.location.href = '#results'}
          >
            View Results
          </button>
        </div>
      </div>

      {/* Department Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Building className="h-6 w-6 text-gray-600" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{stat.value}</h3>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Today's Classes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingClasses.map((class_) => (
                <div key={class_._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{class_.course}</h4>
                    <p className="text-sm text-gray-500">Room {class_.room}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{class_.time}</div>
                    <div className="text-sm text-gray-500">{class_.students} students</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Grades */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Grades</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
            {recentGrades.map((grade, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{grade.studentId.name}</h4>
                  <p className="text-sm text-gray-500">{grade.courseId.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{grade.grade}</div>
                  <div className="text-sm text-gray-500">{new Date(grade.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* My Courses */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Courses</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherCourses.map((course) => (
              <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{course.name}</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {course.level}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">Course Code: {course.code}</p>
                <p className="text-sm text-gray-500">{course.credits} Credits</p>
                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm hover:bg-blue-200 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
