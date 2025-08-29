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
  Building
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
          { id: 'settings', icon: Settings, label: 'Settings' }
        ];
      case 'teacher':
        return [
          { id: 'dashboard', icon: Home, label: 'Dashboard' },
          { id: 'courses', icon: BookOpen, label: 'My Courses' },
          { id: 'students', icon: GraduationCap, label: 'Students' },
          { id: 'attendance', icon: Calendar, label: 'Attendance' },
          { id: 'grades', icon: BarChart, label: 'Grades' },
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

  const menuItems = getMenuItems();

  return (
    <div className={`
      w-full md:w-64 bg-white shadow-sm border-r h-full overflow-y-auto fixed md:relative z-40 md:z-auto inset-y-0 left-0 
      transform transition-transform duration-300 ease-in-out md:transform-none md:flex md:flex-col
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <nav className="mt-8">
        <div className="px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-green-100 text-green-700 border-r-2 border-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;