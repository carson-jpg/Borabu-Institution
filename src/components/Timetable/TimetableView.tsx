import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import { timetablesAPI } from '../../services/api';

interface TimetableEntry {
  id: string;
  courseName: string;
  courseCode: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  teacher: string;
  type: 'Lecture' | 'Practical' | 'Tutorial';
}

interface TimetableViewProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TimetableView: React.FC<TimetableViewProps> = ({ studentId, isOpen, onClose }) => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock timetable data - in a real app, this would come from an API
  const mockTimetable: TimetableEntry[] = [
    {
      id: '1',
      courseName: 'ICT Certificate',
      courseCode: 'ICT101',
      day: 'Monday',
      startTime: '09:00',
      endTime: '11:00',
      room: 'Lab 101',
      teacher: 'Dr. John Smith',
      type: 'Lecture'
    },
    {
      id: '2',
      courseName: 'Computer Programming',
      courseCode: 'CS102',
      day: 'Monday',
      startTime: '14:00',
      endTime: '16:00',
      room: 'Lab 102',
      teacher: 'Prof. Jane Doe',
      type: 'Practical'
    },
    {
      id: '3',
      courseName: 'Graphic Design',
      courseCode: 'GD201',
      day: 'Tuesday',
      startTime: '10:00',
      endTime: '12:00',
      room: 'Design Studio',
      teacher: 'Ms. Sarah Wilson',
      type: 'Tutorial'
    },
    {
      id: '4',
      courseName: 'Database Management',
      courseCode: 'DB301',
      day: 'Wednesday',
      startTime: '13:00',
      endTime: '15:00',
      room: 'Lab 103',
      teacher: 'Dr. Michael Brown',
      type: 'Lecture'
    },
    {
      id: '5',
      courseName: 'Web Development',
      courseCode: 'WD202',
      day: 'Thursday',
      startTime: '09:00',
      endTime: '11:00',
      room: 'Lab 201',
      teacher: 'Mr. David Lee',
      type: 'Practical'
    }
  ];

  useEffect(() => {
    const fetchTimetable = async () => {
      if (isOpen && studentId) {
        setLoading(true);
        try {
          const response = await timetablesAPI.getStudentTimetable(studentId);
          if (response && response.entries) {
            // Transform API response to match component interface
            const transformedEntries: TimetableEntry[] = response.entries.map((entry: any) => ({
              id: entry._id,
              courseName: entry.courseId.name,
              courseCode: entry.courseId.code,
              day: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
              room: entry.room,
              teacher: entry.teacherId.name,
              type: entry.type
            }));
            setTimetable(transformedEntries);
          } else {
            // If no timetable found, show empty state
            setTimetable([]);
          }
        } catch (error) {
          console.error('Error fetching timetable:', error);
          // Fallback to mock data if API fails
          setTimetable(mockTimetable);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTimetable();
  }, [isOpen, studentId]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

  const getClassForTimeSlot = (day: string, time: string) => {
    return timetable.find(entry =>
      entry.day === day &&
      entry.startTime <= time &&
      entry.endTime > time
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Lecture': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'Practical': return 'bg-green-100 border-green-300 text-green-800';
      case 'Tutorial': return 'bg-purple-100 border-purple-300 text-purple-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Weekly Timetable</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">Time</th>
                    {daysOfWeek.map(day => (
                      <th key={day} className="border border-gray-300 p-3 text-center font-semibold text-gray-700 min-w-[150px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => (
                    <tr key={time} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium text-gray-700 bg-gray-50">
                        {time}
                      </td>
                      {daysOfWeek.map(day => {
                        const classEntry = getClassForTimeSlot(day, time);
                        return (
                          <td key={`${day}-${time}`} className="border border-gray-300 p-2 min-h-[80px]">
                            {classEntry ? (
                              <div className={`p-2 rounded border ${getTypeColor(classEntry.type)} h-full`}>
                                <div className="font-semibold text-sm mb-1">{classEntry.courseCode}</div>
                                <div className="text-xs mb-1 truncate">{classEntry.courseName}</div>
                                <div className="flex items-center text-xs mb-1">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {classEntry.startTime}-{classEntry.endTime}
                                </div>
                                <div className="flex items-center text-xs mb-1">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {classEntry.room}
                                </div>
                                <div className="flex items-center text-xs">
                                  <User className="w-3 h-3 mr-1" />
                                  <span className="truncate">{classEntry.teacher}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                                No class
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Lecture</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Practical</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Tutorial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableView;
