import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  Bell,
  BarChart,
  Settings,
  Building,
  FileText,
  User,
  Award,
  MessageSquare,
  Star,
  TrendingUp,
  Upload
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen }) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { id: 'dashboard', icon: Home, label: 'Dashboard' },
          { id: 'departments', icon: Building, label: 'Departments' },
          { id: 'courses', icon: BookOpen, label: 'Courses' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'students', icon: GraduationCap, label: 'Students' },
          { id: 'reports', icon: BarChart, label: 'Reports' },
          { id: 'announcements', icon: Bell, label: 'Announcements' },
          { id: 'transcripts', icon: FileText, label: 'Transcript Management' },
          { id: 'timetables', icon: Calendar, label: 'Timetable Management' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ];
      case 'teacher':
        return [
          { id: 'overview', icon: BarChart, label: 'Overview' },
          { id: 'profile', icon: User, label: 'Profile' },
          { id: 'courses', icon: BookOpen, label: 'My Courses' },
          { id: 'attendance', icon: Calendar, label: 'Attendance' },
          { id: 'grades', icon: Award, label: 'Grades' },
          { id: 'assignments', icon: FileText, label: 'Assignments' },
          { id: 'materials', icon: Upload, label: 'Materials' },
          { id: 'messages', icon: MessageSquare, label: 'Messages' },
          { id: 'feedback', icon: Star, label: 'Feedback' },
          { id: 'reports', icon: TrendingUp, label: 'Reports' },
          { id: 'announcements', icon: Bell, label: 'Announcements' }
        ];
      case 'student':
        return [
          { id: 'dashboard', icon: Home, label: 'Dashboard' },
          { id: 'courses', icon: BookOpen, label: 'My Courses' },
          { id: 'grades', icon: BarChart, label: 'Grades' },
          { id: 'attendance', icon: Calendar, label: 'Attendance' },
          { id: 'fees', icon: CreditCard, label: 'Fees' },
          { id: 'announcements', icon: Bell, label: 'Announcements' }
        ];
      default:
        return [];
    }
  };

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'teacher':
        return 'Teacher Dashboard';
      case 'student':
        return 'Student Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className={`
      w-full md:w-64 bg-gradient-to-b from-slate-50 to-slate-100 shadow-lg border-r border-slate-200 h-full overflow-y-auto fixed md:relative z-40 md:z-auto inset-y-0 left-0
      transform transition-transform duration-300 ease-in-out md:transform-none md:flex md:flex-col
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-lg">
        <h1 className="text-2xl font-bold mb-2">{getDashboardTitle()}</h1>
        <p className="text-sm opacity-90">Welcome back, {user?.name}</p>
      </div>
      <nav className="flex-grow px-4 py-6">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-md transform scale-105'
                      : 'text-slate-700 hover:bg-white hover:shadow-sm hover:text-blue-600 hover:transform hover:scale-102'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors ${
                    activeTab === item.id
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-blue-600'
                  }`} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
