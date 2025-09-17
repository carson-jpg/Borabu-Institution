import React, { useState, useEffect } from 'react';
import { User, Search, Filter, Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { studentsAPI, departmentsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StudentManagement: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [studentsData, departmentsData] = await Promise.all([
        studentsAPI.getAll(),
        departmentsAPI.getAll()
      ]);

      setStudents(studentsData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching students data:', error);
      setError('Failed to load student data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStudents = students.filter(student => {
    const studentName = student.userId?.name || '';
    const studentEmail = student.userId?.email || '';
    const admissionNo = student.admissionNo || '';

    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || student.departmentId?._id === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (fees: any[]) => {
    if (!fees || !Array.isArray(fees)) return 'bg-gray-100 text-gray-800';

    const totalFees = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    const paidFees = fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + (fee.amount || 0), 0);
    const balance = totalFees - paidFees;

    if (balance === 0) return 'bg-green-100 text-green-800';
    if (balance > 0 && fees.some(f => f.status === 'overdue')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (fees: any[]) => {
    if (!fees || !Array.isArray(fees)) return 'No Data';

    const totalFees = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    const paidFees = fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + (fee.amount || 0), 0);
    const balance = totalFees - paidFees;

    if (balance === 0) return 'Paid Up';
    if (balance > 0 && fees.some(f => f.status === 'overdue')) return 'Overdue';
    return 'Pending';
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
  };

  const handleDelete = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await studentsAPI.delete(studentId);
        fetchData();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Failed to delete student. Please try again.');
      }
    }
  };

  const AddStudentForm = () => {
    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
      admissionNo: '',
      departmentId: '',
      year: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingStudent) {
          await studentsAPI.update(editingStudent._id, {
            admissionNo: formData.admissionNo,
            departmentId: formData.departmentId,
            year: Number(formData.year)
          });
          setEditingStudent(null);
        } else {
          // Create user first
          const newUser = await usersAPI.create({
            name: formData.name,
            email: formData.email,
            password: 'defaultPassword123', // You may want to generate or ask for password
            role: 'student'
          });

          // Create student linked to user
          await studentsAPI.create({
            userId: newUser._id,
            admissionNo: formData.admissionNo,
            departmentId: formData.departmentId,
            year: Number(formData.year),
            courses: []
          });
        }
        setShowAddForm(false);
        fetchData();
      } catch (error) {
        console.error('Error saving student:', error);
      }
    };

    React.useEffect(() => {
      if (editingStudent) {
        setFormData({
          name: editingStudent.userId?.name || '',
          email: editingStudent.userId?.email || '',
          admissionNo: editingStudent.admissionNo || '',
          departmentId: editingStudent.departmentId?._id || '',
          year: editingStudent.year ? editingStudent.year.toString() : ''
        });
        setShowAddForm(true);
      }
    }, [editingStudent]);

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {!editingStudent && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter student name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Admission Number</label>
                <input
                  type="text"
                  name="admissionNo"
                  required
                  value={formData.admissionNo}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter admission number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  name="departmentId"
                  required
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <select
                  name="year"
                  required
                  value={formData.year}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Year</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  {editingStudent ? 'Update' : 'Add'} Student
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-2" />
            {filteredStudents.length} students found
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admission No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                return (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.userId?.name || 'Unknown Student'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.userId?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.admissionNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.departmentId?.name || 'No Department'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Year {student.year}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.fees)}`}>
                        {getStatusText(student.fees)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(student._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search filters.</p>
        </div>
      )}

      {showAddForm && <AddStudentForm />}
    </div>
  );
};

export default StudentManagement;
