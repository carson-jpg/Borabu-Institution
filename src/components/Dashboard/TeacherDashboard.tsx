import React, { useState, useEffect } from 'react';
import {
  BookOpen, Users, Bell, MessageSquare,
  FileText, User, Upload, Mail, Star, TrendingUp,
  Calendar, Award
} from 'lucide-react';
import {
  coursesAPI, studentsAPI, attendanceAPI,
  announcementsAPI, assignmentsAPI, messagesAPI, feedbackAPI, teachersAPI
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TeacherDashboardProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ activeTab: propActiveTab, onTabChange }) => {
  const { user } = useAuth();
  const [internalActiveTab, setInternalActiveTab] = useState(propActiveTab || 'overview');

  useEffect(() => {
    if (propActiveTab) {
      setInternalActiveTab(propActiveTab);
    }
  }, [propActiveTab]);

  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  // Interfaces
  interface Course {
    _id: string;
    name: string;
    code: string;
    level: string;
    credits: number;
  }

  interface Student {
    _id: string;
    userId?: {
      name: string;
      email?: string;
    };
    admissionNo: string;
    courses?: Course[];
    year: number;
  }

  interface Announcement {
    _id: string;
    title: string;
    content: string;
    createdAt: string;
  }

  interface Assignment {
    _id: string;
    title: string;
    dueDate: string;
    courseId: Course;
  }

  interface Message {
    _id: string;
    subject: string;
    content: string;
    senderId: { name: string; email?: string };
    isRead: boolean;
    createdAt: string;
  }

  interface Feedback {
    _id: string;
    studentId: Student;
    courseId: Course;
    content: string;
    rating?: number;
    createdAt: string;
  }

  // State variables
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<Student[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchTeacherData = async () => {
        try {
          if (!user?.id) {
            console.error('User ID not available');
            return;
          }

          // Get teacher info to get departmentId
          console.log('Fetching teacher info...');
          const teacherInfo = await teachersAPI.getByUserId(user.id);
          console.log('Teacher info received:', teacherInfo);

          // Get courses taught by this teacher
          console.log('Fetching courses taught by teacher...');
          const coursesData = await coursesAPI.getAll({ teacherId: teacherInfo._id });
          console.log('Courses data received:', coursesData);
          setTeacherCourses(coursesData);

          // Get students enrolled in teacher's department
          console.log('Fetching students by department...');
          const studentsData = await studentsAPI.getAll({ departmentId: teacherInfo.departmentId });
          console.log('Students data received:', studentsData);
          // Filter students enrolled in teacher's courses
          const enrolledStudents = studentsData.filter((s: any) => {
            if (!s.courses || s.courses.length === 0) return false;
            return s.courses.some((course: any) => coursesData.some((tc: any) => tc._id === course._id));
          });
          console.log('Enrolled students:', enrolledStudents);
          setTeacherStudents(enrolledStudents);

        // Fetch attendance records
        console.log('Fetching attendance records...');
        const attendanceData = await attendanceAPI.getAll({ courseId: coursesData.map((course: any) => course._id) });
        console.log('Attendance data received:', attendanceData);

        // Fetch upcoming classes
        console.log('Fetching upcoming classes...');
        const classesData = await attendanceAPI.getUpcomingClasses({ teacherEmail: user?.email });
        console.log('Upcoming classes data received:', classesData);
        setUpcomingClasses(classesData);

        // Fetch recent announcements
        console.log('Fetching announcements...');
        const announcementsData = await announcementsAPI.getAll({ limit: 5, sort: '-createdAt' });
        console.log('Announcements data received:', announcementsData);
        setAnnouncements(announcementsData);

        // Fetch pending assignments
        console.log('Fetching assignments...');
        const assignmentsData = await assignmentsAPI.getAll({ teacherId: user?.id, status: 'pending' });
        console.log('Assignments data received:', assignmentsData);
        setPendingAssignments(assignmentsData);

        // Fetch unread messages
        console.log('Fetching messages...');
        const messagesData = await messagesAPI.getAll({ isRead: false });
        console.log('Messages data received:', messagesData);
        setUnreadMessages(messagesData);

        // Fetch recent feedback
        console.log('Fetching feedback...');
        const feedbackData = await feedbackAPI.getForTeacher();
        console.log('Feedback data received:', feedbackData);
        setRecentFeedback(feedbackData.slice(0, 5));

      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTeacherData();
    }
  }, [user]);

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
      title: 'Unread Messages',
      value: unreadMessages.length.toString(),
      icon: Mail,
      color: 'bg-red-500'
    },
    {
      title: 'Pending Assignments',
      value: pendingAssignments.length.toString(),
      icon: FileText,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
        {internalActiveTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-md ${stat.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        <p className="text-sm text-gray-500">{stat.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => handleTabChange('attendance')}
                  className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <Calendar className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Take Attendance</span>
                </button>
                <button
                  onClick={() => handleTabChange('assignments')}
                  className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FileText className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Manage Assignments</span>
                </button>
                <button
                  onClick={() => handleTabChange('grades')}
                  className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <Award className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Grade Students</span>
                </button>
                <button
                  onClick={() => handleTabChange('messages')}
                  className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                >
                  <MessageSquare className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Send Message</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Announcements */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Announcements</h3>
                <div className="space-y-3">
                  {announcements.slice(0, 3).map((announcement) => (
                    <div key={announcement._id} className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{announcement.content.substring(0, 100)}...</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Assignments */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Assignments</h3>
                <div className="space-y-3">
                  {pendingAssignments.slice(0, 3).map((assignment) => (
                    <div key={assignment._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <p className="text-sm text-gray-500">{assignment.courseId?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Today's Classes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Classes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingClasses.map((class_) => (
                  <div key={class_._id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{class_.course}</h4>
                    <p className="text-sm text-gray-500">Room {class_.room}</p>
                    <p className="text-sm text-gray-500">{class_.time}</p>
                    <p className="text-sm text-gray-500">{class_.students} students</p>
                  </div>
                ))}
              </div>
            </div>

            {/* My Students */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">My Students ({teacherStudents.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacherStudents.slice(0, 6).map((student) => (
                  <div key={student._id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{(student as any).name || student.userId?.name || 'Unknown'}</h4>
                    <p className="text-sm text-gray-500">Admission No: {student.admissionNo}</p>
                    <p className="text-sm text-gray-500">Year: {student.year}</p>
                    <p className="text-sm text-gray-500">Courses: {student.courses?.length || 0}</p>
                  </div>
                ))}
                {teacherStudents.length > 6 && (
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-center">
                    <p className="text-sm text-gray-500">+{teacherStudents.length - 6} more students</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {internalActiveTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Management</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
                  <p className="text-gray-500">{user?.email}</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Change Photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Office Hours</label>
                  <input
                    type="text"
                    placeholder="e.g., Mon-Fri 9AM-5PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Update Profile
                </button>
                <button className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        {internalActiveTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Add New Course
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherCourses.map((course) => (
                <div key={course._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
                      <p className="text-sm text-gray-500">Code: {course.code}</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {course.level}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Credits:</strong> {course.credits}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Students:</strong> {teacherStudents.filter(s =>
                        s.courses?.some(c => c._id === course._id)
                      ).length}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded text-sm hover:bg-blue-200 transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded text-sm hover:bg-green-200 transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {internalActiveTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                New Message
              </button>
            </div>

            <div className="space-y-4">
              {unreadMessages.map((message) => (
                <div key={message._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{message.subject}</h4>
                      <p className="text-sm text-gray-600 mt-1">{message.content.substring(0, 100)}...</p>
                      <p className="text-xs text-gray-500 mt-2">
                        From: {message.senderId?.name} • {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!message.isRead && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {internalActiveTab === 'feedback' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Student Feedback</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Give Feedback
              </button>
            </div>

            <div className="space-y-4">
              {recentFeedback.map((feedback) => (
                <div key={feedback._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{feedback.studentId?.userId?.name || 'Unknown Student'}</h4>
                      <p className="text-sm text-gray-500">{feedback.courseId?.name}</p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (feedback.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700">{feedback.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for other sections */}
        {['attendance', 'grades', 'assignments', 'materials', 'reports', 'announcements'].includes(internalActiveTab) && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {internalActiveTab === 'attendance' && 'Attendance'}
              {internalActiveTab === 'grades' && 'Grades'}
              {internalActiveTab === 'assignments' && 'Assignments'}
              {internalActiveTab === 'materials' && 'Materials'}
              {internalActiveTab === 'reports' && 'Reports'}
              {internalActiveTab === 'announcements' && 'Announcements'}
            </h2>
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {internalActiveTab === 'attendance' && <Calendar className="h-16 w-16 mx-auto" />}
                {internalActiveTab === 'grades' && <Award className="h-16 w-16 mx-auto" />}
                {internalActiveTab === 'assignments' && <FileText className="h-16 w-16 mx-auto" />}
                {internalActiveTab === 'materials' && <Upload className="h-16 w-16 mx-auto" />}
                {internalActiveTab === 'reports' && <TrendingUp className="h-16 w-16 mx-auto" />}
                {internalActiveTab === 'announcements' && <Bell className="h-16 w-16 mx-auto" />}
              </div>
              <p className="text-gray-500">
                {internalActiveTab === 'attendance' && 'Attendance'}
                {internalActiveTab === 'grades' && 'Grades'}
                {internalActiveTab === 'assignments' && 'Assignments'}
                {internalActiveTab === 'materials' && 'Materials'}
                {internalActiveTab === 'reports' && 'Reports'}
                {internalActiveTab === 'announcements' && 'Announcements'} management will be available here.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                This section integrates with existing components.
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default TeacherDashboard;
