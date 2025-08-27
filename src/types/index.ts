export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  profilePic?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  level: 'Artisan' | 'Certificate' | 'Diploma';
  departmentId: string;
  teacherId: string;
  credits: number;
}

export interface Student {
  id: string;
  userId: string;
  admissionNo: string;
  departmentId: string;
  courses: string[];
  fees: FeeRecord[];
  year: number;
}

export interface Teacher {
  id: string;
  userId: string;
  departmentId: string;
  courses: string[];
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  grade: string;
  semester: number;
  year: number;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  postedBy: string;
  targetAudience: string[];
}

export interface FeeRecord {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  description: string;
}