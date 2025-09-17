import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, XCircle, Upload } from 'lucide-react';
import { timetablesAPI, departmentsAPI, coursesAPI, usersAPI } from '../../services/api';
import TimetableBulkUpload from './TimetableBulkUpload';

interface TimetableEntry {
  _id?: string;
  courseId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  semester: number;
}

interface Timetable {
  _id: string;
  departmentId: {
    _id: string;
    name: string;
  };
  year: number;
  entries: TimetableEntry[];
  academicYear: string;
  isActive: boolean;
  createdAt: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
  level: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const TimetableManagement: React.FC = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [entryErrors, setEntryErrors] = useState<{ [key: number]: string[] }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [formData, setFormData] = useState({
    departmentId: '',
    year: 1,
    entries: [] as TimetableEntry[],
    academicYear: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetablesRes, departmentsRes, coursesRes, teachersRes] = await Promise.all([
        timetablesAPI.getAll(),
        departmentsAPI.getAll(),
        coursesAPI.getAll(),
        usersAPI.getAll({ role: 'teacher' })
      ]);

      console.log('Departments fetched:', departmentsRes);

      setTimetables(timetablesRes);
      setDepartments(departmentsRes);
      setCourses(coursesRes);
      setTeachers(teachersRes);

      // Set default departmentId if not set and departments exist
      if (departmentsRes.length > 0 && !formData.departmentId) {
        setFormData((prev) => ({ ...prev, departmentId: departmentsRes[0]._id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateTimetableEntry = (entry: TimetableEntry, index: number): string[] => {
    const errors: string[] = [];

    if (!entry.courseId) errors.push('Course is required');
    if (!entry.teacherId) errors.push('Teacher is required');
    if (!entry.dayOfWeek) errors.push('Day is required');
    if (!entry.startTime) errors.push('Start time is required');
    if (!entry.endTime) errors.push('End time is required');
    if (!entry.room) errors.push('Room is required');
    if (!entry.type) errors.push('Type is required');

    // Time validation
    if (entry.startTime && entry.endTime) {
      const start = new Date(`2000-01-01T${entry.startTime}`);
      const end = new Date(`2000-01-01T${entry.endTime}`);
      if (start >= end) {
        errors.push('End time must be after start time');
      }
    }

    return errors;
  };

  const checkForConflicts = (entries: TimetableEntry[]): string[] => {
    const conflicts: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entry1 = entries[i];
        const entry2 = entries[j];

        // Check for room conflicts
        if (entry1.dayOfWeek === entry2.dayOfWeek && entry1.room === entry2.room) {
          const start1 = new Date(`2000-01-01T${entry1.startTime}`);
          const end1 = new Date(`2000-01-01T${entry1.endTime}`);
          const start2 = new Date(`2000-01-01T${entry2.startTime}`);
          const end2 = new Date(`2000-01-01T${entry2.endTime}`);

          // Check for time overlap
          if ((start1 <= start2 && end1 > start2) || (start2 <= start1 && end2 > start1)) {
            conflicts.push(`Room conflict: ${entry1.room} on ${entry1.dayOfWeek} (${entry1.startTime}-${entry1.endTime} and ${entry2.startTime}-${entry2.endTime})`);
          }
        }

        // Check for teacher conflicts
        if (entry1.dayOfWeek === entry2.dayOfWeek && entry1.teacherId === entry2.teacherId) {
          const start1 = new Date(`2000-01-01T${entry1.startTime}`);
          const end1 = new Date(`2000-01-01T${entry1.endTime}`);
          const start2 = new Date(`2000-01-01T${entry2.startTime}`);
          const end2 = new Date(`2000-01-01T${entry2.endTime}`);

          if ((start1 <= start2 && end1 > start2) || (start2 <= start1 && end2 > start1)) {
            const teacher1 = teachers.find(t => t._id === entry1.teacherId)?.name || 'Unknown';
            conflicts.push(`Teacher conflict: ${teacher1} on ${entry1.dayOfWeek} (${entry1.startTime}-${entry1.endTime} and ${entry2.startTime}-${entry2.endTime})`);
          }
        }
      }
    }

    return conflicts;
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const entryErrs: { [key: number]: string[] } = {};

    // Basic validation
    if (!formData.departmentId) errors.push('Department is required');
    if (!formData.year) errors.push('Year is required');
    if (!formData.academicYear) errors.push('Academic year is required');
    if (formData.entries.length === 0) errors.push('At least one class entry is required');

    // Validate each entry
    formData.entries.forEach((entry, index) => {
      const entryValidationErrors = validateTimetableEntry(entry, index);
      if (entryValidationErrors.length > 0) {
        entryErrs[index] = entryValidationErrors;
      }
    });

    // Check for conflicts
    const conflicts = checkForConflicts(formData.entries);
    if (conflicts.length > 0) {
      errors.push(...conflicts);
    }

    setValidationErrors(errors);
    setEntryErrors(entryErrs);

    return errors.length === 0 && Object.keys(entryErrs).length === 0;
  };

  const handleCreate = () => {
    setEditingTimetable(null);
    setValidationErrors([]);
    setEntryErrors({});
    setFormData({
      departmentId: departments.length > 0 ? departments[0]._id : '',
      year: 1,
      entries: [],
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    });
    setShowModal(true);
  };

  const handleEdit = (timetable: Timetable) => {
    setEditingTimetable(timetable);
    setValidationErrors([]);
    setEntryErrors({});
    setFormData({
      departmentId: timetable.departmentId._id,
      year: timetable.year,
      entries: timetable.entries,
      academicYear: timetable.academicYear
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this timetable? This action cannot be undone.')) {
      try {
        await timetablesAPI.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting timetable:', error);
        alert('Failed to delete timetable. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (editingTimetable) {
        await timetablesAPI.update(editingTimetable._id, formData);
      } else {
        await timetablesAPI.create(formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving timetable:', error);
      if (error.message) {
        setValidationErrors([error.message]);
      } else {
        setValidationErrors(['Failed to save timetable. Please try again.']);
      }
    } finally {
      setSaving(false);
    }
  };

  const addEntry = () => {
    setFormData({
      ...formData,
      entries: [...formData.entries, {
        courseId: '',
        teacherId: '',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
        room: '',
        type: 'Lecture',
        semester: 1
      }]
    });
  };

  const updateEntry = (index: number, field: string, value: any) => {
    const updatedEntries = [...formData.entries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setFormData({ ...formData, entries: updatedEntries });

    // Clear validation errors for this entry when user starts editing
    if (entryErrors[index]) {
      const newEntryErrors = { ...entryErrors };
      delete newEntryErrors[index];
      setEntryErrors(newEntryErrors);
    }
  };

  const removeEntry = (index: number) => {
    setFormData({
      ...formData,
      entries: formData.entries.filter((_, i) => i !== index)
    });

    // Remove validation errors for this entry
    if (entryErrors[index]) {
      const newEntryErrors = { ...entryErrors };
      delete newEntryErrors[index];
      setEntryErrors(newEntryErrors);
    }
  };

  // Filter timetables based on search and filters
  const filteredTimetables = timetables.filter(timetable => {
    const matchesSearch = searchTerm === '' ||
      timetable.departmentId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      timetable.academicYear.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === '' || timetable.departmentId._id === selectedDepartment;
    const matchesYear = selectedYear === '' || timetable.year === selectedYear;

    return matchesSearch && matchesDepartment && matchesYear;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Timetable
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search timetables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Years</option>
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
              <option value={4}>Year 4</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('');
                setSelectedYear('');
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Timetables List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTimetables.map((timetable) => (
          <div key={timetable._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {timetable.departmentId.name} - Year {timetable.year}
                </h3>
                <p className="text-sm text-gray-600">{timetable.academicYear}</p>
                <div className="flex items-center mt-1">
                  {timetable.isActive ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600 text-sm">
                      <XCircle className="w-4 h-4 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(timetable)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit timetable"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(timetable._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete timetable"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {timetable.entries.length} classes scheduled
              </p>
              <div className="flex flex-wrap gap-1">
                {timetable.entries.slice(0, 3).map((entry, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                  >
                    {entry.dayOfWeek.slice(0, 3)} {entry.startTime}
                  </span>
                ))}
                {timetable.entries.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{timetable.entries.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showBulkUpload && (
        <TimetableBulkUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            setShowBulkUpload(false);
            fetchData();
          }}
        />
      )}

      {filteredTimetables.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No timetables found matching your criteria.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTimetable ? 'Edit Timetable' : 'Create Timetable'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2024-2025"
                    required
                  />
                </div>
              </div>

              {/* Entries */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Class Schedule</h3>
                  <button
                    type="button"
                    onClick={addEntry}
                    className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Class
                  </button>
                </div>

                {formData.entries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No classes added yet. Click "Add Class" to get started.
                  </div>
                )}

                <div className="space-y-4">
                  {formData.entries.map((entry, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${entryErrors[index] ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Class {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeEntry(index)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove this class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Entry validation errors */}
                      {entryErrors[index] && entryErrors[index].length > 0 && (
                        <div className="mb-3 bg-red-50 border border-red-200 rounded p-2">
                          <ul className="text-xs text-red-700 list-disc list-inside">
                            {entryErrors[index].map((error, errorIndex) => (
                              <li key={errorIndex}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Course *
                          </label>
                          <select
                            value={entry.courseId}
                            onChange={(e) => updateEntry(index, 'courseId', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${entryErrors[index]?.includes('Course is required') ? 'border-red-300' : 'border-gray-300'}`}
                            required
                          >
                            <option value="">Select Course</option>
                            {courses.map((course) => (
                              <option key={course._id} value={course._id}>
                                {course.code} - {course.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teacher *
                          </label>
                          <select
                            value={entry.teacherId}
                            onChange={(e) => updateEntry(index, 'teacherId', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${entryErrors[index]?.includes('Teacher is required') ? 'border-red-300' : 'border-gray-300'}`}
                            required
                          >
                            <option value="">Select Teacher</option>
                            {teachers.map((teacher) => (
                              <option key={teacher._id} value={teacher._id}>
                                {teacher.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Day *
                          </label>
                          <select
                            value={entry.dayOfWeek}
                            onChange={(e) => updateEntry(index, 'dayOfWeek', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${entryErrors[index]?.includes('Day is required') ? 'border-red-300' : 'border-gray-300'}`}
                            required
                          >
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type *
                          </label>
                          <select
                            value={entry.type}
                            onChange={(e) => updateEntry(index, 'type', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${entryErrors[index]?.includes('Type is required') ? 'border-red-300' : 'border-gray-300'}`}
                            required
                          >
                            <option value="Lecture">Lecture</option>
                            <option value="Practical">Practical</option>
                            <option value="Tutorial">Tutorial</option>
                            <option value="Lab">Lab</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time *
                          </label>
                          <input
                            type="time"
                            value={entry.startTime}
                            onChange={(e) => updateEntry(index, 'startTime', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${entryErrors[index]?.some(e => e.includes('time')) ? 'border-red-300' : 'border-gray-300'}`}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Time *
                          </label>
                          <input
                            type="time"
                            value={entry.endTime}
                            onChange={(e) => updateEntry(index, 'endTime', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${entryErrors[index]?.some(e => e.includes('time')) ? 'border-red-300' : 'border-gray-300'}`}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Room *
                          </label>
                          <input
                            type="text"
                            value={entry.room}
                            onChange={(e) => updateEntry(index, 'room', e.target.value)}
                            className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${entryErrors[index]?.includes('Room is required') ? 'border-red-300' : 'border-gray-300'}`}
                            placeholder="e.g., Lab 101"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Semester *
                          </label>
                          <select
                            value={entry.semester}
                            onChange={(e) => updateEntry(index, 'semester', parseInt(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value={1}>Semester 1</option>
                            <option value={2}>Semester 2</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
                  disabled={saving}
                >
                  {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                  {editingTimetable ? 'Update' : 'Create'} Timetable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;
