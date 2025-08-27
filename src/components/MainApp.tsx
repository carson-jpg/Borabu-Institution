import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import AdminDashboard from './Dashboard/AdminDashboard';
import TeacherDashboard from './Dashboard/TeacherDashboard';
import StudentDashboard from './Dashboard/StudentDashboard';
import CourseManagement from './Courses/CourseManagement';
import StudentManagement from './Students/StudentManagement';
import FeeManagement from './Fees/FeeManagement';
import AnnouncementManagement from './Announcements/AnnouncementManagement';
import AttendanceManagement from './Attendance/AttendanceManagement';
import GradeManagement from './Grades/GradeManagement';
import DepartmentManagement from './Departments/DepartmentManagement';
import ReportManagement from './Reports/ReportManagement';
import UserManagement from './Users/UserManagement';
import TranscriptDownload from './Transcripts/TranscriptDownload';
import TeacherResultsView from './Grades/TeacherResultsView';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (user?.role === 'admin') return <AdminDashboard />;
        if (user?.role === 'teacher') return <TeacherDashboard />;
        if (user?.role === 'student') return <StudentDashboard />;
        break;
      case 'courses':
        return <CourseManagement />;
      case 'students':
        return <StudentManagement />;
      case 'fees':
        return <FeeManagement />;
      case 'announcements':
        return <AnnouncementManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'users':
        return <UserManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'transcript':
        return <TranscriptDownload />;
      case 'results':
        return <TeacherResultsView />;
      case 'grades':
        return <GradeManagement />;
      case 'reports':
        return <ReportManagement />;
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600">Settings functionality coming soon...</p></div>;
      default:
        return <AdminDashboard />;
    }
  };

  return (
<div className="h-screen flex flex-col background-image">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainApp;
