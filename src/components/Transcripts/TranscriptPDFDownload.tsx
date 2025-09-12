import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, transcriptsAPI } from '../../services/api';
import { Download, FileText } from 'lucide-react';

const TranscriptPDFDownload: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchTranscripts();
    }
  }, [user]);

  const fetchTranscripts = async () => {
    setLoading(true);
    try {
      const studentData = await studentsAPI.getByUserId(user?.id || '');
      // Fetch transcripts using the transcripts API
      const transcriptsData = await transcriptsAPI.getByStudentId(studentData._id);
      setTranscripts(transcriptsData);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTranscript = async (transcript: any) => {
    try {
      // Use the transcripts API download method
      await transcriptsAPI.download(transcript._id);
    } catch (error) {
      console.error('Error downloading transcript:', error);
      alert('Failed to download transcript. Please try again.');
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <FileText className="h-8 w-8 text-blue-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-900">Download Your Transcripts</h2>
      </div>

      {transcripts.length > 0 ? (
        <ul className="space-y-4">
          {transcripts.map((transcript) => (
            <li key={transcript._id} className="flex justify-between items-center p-4 border rounded">
              <span className="text-gray-700">{transcript.originalName}</span>
              <button
                onClick={() => downloadTranscript(transcript)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No transcripts available for download.</p>
      )}
    </div>
  );
};

export default TranscriptPDFDownload;
