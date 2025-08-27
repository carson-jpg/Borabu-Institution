import React, { useState } from 'react';
import { useEffect } from 'react';
import { Bell, Plus, Edit, Trash2, Calendar, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { announcementsAPI } from '../../services/api';

const AnnouncementManagement: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementsAPI.getAll();
        setAnnouncements(data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(announcement => {
    if (selectedAudience === 'all') return true;
    if (user?.role === 'student') return announcement.targetAudience.includes('student');
    if (user?.role === 'teacher') return announcement.targetAudience.includes('teacher');
    return announcement.targetAudience.includes(selectedAudience);
  });

  const AddAnnouncementForm = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [audience, setAudience] = useState<string[]>([]);

    const handleAudienceChange = (role: string) => {
      setAudience(prev => 
        prev.includes(role) 
          ? prev.filter(r => r !== role)
          : [...prev, role]
      );
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const announcementData = {
        title,
        content,
        targetAudience: audience
      };
      
      announcementsAPI.create(announcementData)
        .then(newAnnouncement => {
          setAnnouncements([newAnnouncement, ...announcements]);
          setShowAddForm(false);
          setTitle('');
          setContent('');
          setAudience([]);
        })
        .catch(error => {
          console.error('Error creating announcement:', error);
        });
    };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Announcement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement content"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                <div className="space-y-2">
                  {['student', 'teacher', 'admin'].map(role => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={audience.includes(role)}
                        onChange={() => handleAudienceChange(role)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{role}s</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Create Announcement
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
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <div className="flex space-x-3">
          <select
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
          >
            <option value="all">All Announcements</option>
            <option value="student">For Students</option>
            <option value="teacher">For Teachers</option>
            <option value="admin">For Admins</option>
          </select>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <div key={announcement._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Bell className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{announcement.content}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {announcement.postedBy.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Target:</span>
                      {announcement.targetAudience.map((audience, index) => (
                        <span key={audience} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {audience.charAt(0).toUpperCase() + audience.slice(1)}s
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {(user?.role === 'admin' || announcement.postedBy._id === user?.id) && (
                  <div className="flex space-x-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'admin' || user?.role === 'teacher' 
              ? 'Create your first announcement to get started.' 
              : 'Check back later for new announcements.'
            }
          </p>
        </div>
      )}

      {showAddForm && <AddAnnouncementForm />}
    </div>
  );
};

export default AnnouncementManagement;