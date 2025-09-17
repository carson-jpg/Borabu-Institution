import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, transcriptsAPI } from '../../services/api';
import { Download, FileText, Eye, X } from 'lucide-react';

const TranscriptPDFDownload: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [previewTranscript, setPreviewTranscript] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const previewTranscriptHandler = (transcript: any) => {
    setPreviewTranscript(transcript);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewTranscript(null);
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
              <div className="flex space-x-2">
                <button
                  onClick={() => previewTranscriptHandler(transcript)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </button>
                <button
                  onClick={() => downloadTranscript(transcript)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No transcripts available for download.</p>
      )}

      {/* Preview Modal */}
      {showPreview && previewTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview: {previewTranscript.originalName}
              </h3>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <iframe
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/transcripts/view/${previewTranscript._id}`}
                className="w-full h-[70vh] border rounded"
                title={`Preview of ${previewTranscript.originalName}`}
              />
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50">
              <button
                onClick={closePreview}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  downloadTranscript(previewTranscript);
                  closePreview();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptPDFDownload;
