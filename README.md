# School Student Portal

A comprehensive web-based platform for Borabu Technical Training Institute to manage student, teacher, and administrative activities.

## Features

- **Role-based Authentication** (Student, Teacher, Admin)
- **Department & Course Management**
- **Student Profile Management**
- **Grade Tracking & Attendance**
- **Fee Management System**
- **Announcements & Notifications**
- **Comprehensive Admin Dashboard**

## Tech Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-student-portal
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/school_portal
   JWT_SECRET=your_jwt_secret_key_here_make_it_very_long_and_secure
   PORT=5000
   NODE_ENV=development
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system.

6. **Seed the database** (optional)
   ```bash
   cd server
   node scripts/seedData.js
   ```

7. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

8. **Start the frontend development server**
   ```bash
   # In the root directory
   npm run dev
   ```

## Demo Accounts

After seeding the database, you can use these demo accounts:

- **Admin**: admin@borabu.ac.ke / admin123
- **Teacher**: sarah.kimani@borabu.ac.ke / teacher123
- **Student**: john.doe@student.borabu.ac.ke / student123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department (Admin)
- `PUT /api/departments/:id` - Update department (Admin)
- `DELETE /api/departments/:id` - Delete department (Admin)

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Admin)
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student (Admin)
- `PUT /api/students/:id` - Update student (Admin)
- `POST /api/students/:id/fees` - Add fee record (Admin)

### Grades
- `GET /api/grades` - Get grades
- `POST /api/grades` - Create/update grade (Teacher, Admin)
- `DELETE /api/grades/:id` - Delete grade (Admin)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Record attendance (Teacher, Admin)
- `POST /api/attendance/bulk` - Bulk record attendance (Teacher, Admin)

### Announcements
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement (Teacher, Admin)
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

## Academic Departments

1. **Computing & Informatics**
2. **Electrical & Electronics**
3. **Institutional Management**
4. **Business**
5. **Mechanical Engineering**
6. **Health Sciences**
7. **Liberal Studies**
8. **Building and Construction**
9. **Fashion Design, Beauty & Therapy**

Each department offers programs at three levels:
- **Artisan** (Basic level)
- **Certificate** (Intermediate level)
- **Diploma** (Advanced level)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@borabu.ac.ke or create an issue in the repository.