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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Close sidebar on mobile when a tab is selected
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen flex flex-col background-image">
      <Header 
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange}
          isOpen={isSidebarOpen}
        />
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <main className="flex-1 overflow-y-auto md:ml-0 transition-all duration-300">
          <div className="p-4 md:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainApp;
