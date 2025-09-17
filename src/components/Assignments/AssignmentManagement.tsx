import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesAPI, assignmentsAPI } from '../../services/api';

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  type: 'assignment' | 'quiz' | 'exam';
  courseId: Course;
  teacherId: any;
  dueDate: string;
  totalMarks: number;
  instructions: string;
  attachments: any[];
  isActive: boolean;
  createdAt: string;
}

const AssignmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'assignment' as 'assignment' | 'quiz' | 'exam',
    courseId: '',
    dueDate: '',
    totalMarks: 100,
    instructions: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching courses and assignments');
        const coursesData = await coursesAPI.getAll();
        console.log('Courses data received:', coursesData);
        setCourses(coursesData);

        const assignmentsData = await assignmentsAPI.getAll({ teacherEmail: user?.email });
        console.log('Assignments data received:', assignmentsData);
        setAssignments(assignmentsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'assignment',
      courseId: '',
      dueDate: '',
      totalMarks: 100,
      instructions: ''
    });
    setEditingAssignment(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAssignment) {
        await assignmentsAPI.update(editingAssignment._id, formData);
        alert('Assignment updated successfully!');
      } else {
        await assignmentsAPI.create(formData);
        alert('Assignment created successfully!');
      }

      // Refresh assignments
      const assignmentsData = await assignmentsAPI.getAll({ teacherEmail: user?.email });
      setAssignments(assignmentsData);

      resetForm();
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Failed to save assignment');
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      courseId: assignment.courseId._id,
      dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
      totalMarks: assignment.totalMarks,
      instructions: assignment.instructions
    });
    setShowForm(true);
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await assignmentsAPI.delete(assignmentId);
      alert('Assignment deleted successfully!');

      // Refresh assignments
      const assignmentsData = await assignmentsAPI.getAll({ teacherEmail: user?.email });
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment');
    }
  };

  const toggleActive = async (assignment: Assignment) => {
    try {
      await assignmentsAPI.update(assignment._id, { isActive: !assignment.isActive });

      // Refresh assignments
      const assignmentsData = await assignmentsAPI.getAll({ teacherEmail: user?.email });
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Assignment Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Assignment
        </button>
      </div>

      {/* Assignment Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'assignment' | 'quiz' | 'exam' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks
                </label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions (Optional)
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingAssignment ? 'Update' : 'Create'} Assignment
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Assignments</h3>
        </div>
        <div className="p-6">
          {assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{assignment.title}</h4>
                      <p className="text-sm text-gray-600">{assignment.courseId.name} - {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${assignment.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => toggleActive(assignment)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {assignment.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">{assignment.description}</p>

                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span className="ml-4">Marks: {assignment.totalMarks}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(assignment._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No assignments found. Create your first assignment!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentManagement;
