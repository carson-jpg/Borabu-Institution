import React, { useState } from 'react';
import { Download, BarChart3, Users, BookOpen, TrendingUp, Loader } from 'lucide-react';
import { reportsAPI } from '../../services/api';

const ReportManagement: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const reportTypes = [
    {
      id: 'student-performance',
      title: 'Student Performance Report',
      description: 'Academic performance analysis by student and course',
      icon: Users
    },
    {
      id: 'attendance-summary',
      title: 'Attendance Summary',
      description: 'Attendance statistics by department and course',
      icon: TrendingUp
    },
    {
      id: 'course-enrollment',
      title: 'Course Enrollment Report',
      description: 'Enrollment statistics and trends',
      icon: BookOpen
    },
    {
      id: 'financial-summary',
      title: 'Financial Summary',
      description: 'Fee collection and financial overview',
      icon: BarChart3
    }
  ];

  const handleGenerateReport = async () => {
    if (!selectedReport || !dateRange.start || !dateRange.end) {
      alert('Please select a report and specify a valid date range.');
      return;
    }
    setIsGenerating(true);
    try {
      const apiDateRange = {
        startDate: dateRange.start,
        endDate: dateRange.end
      };
      switch (selectedReport) {
        case 'student-performance':
          await reportsAPI.generateStudentPerformance(apiDateRange);
          break;
        case 'attendance-summary':
          await reportsAPI.generateAttendanceSummary(apiDateRange);
          break;
        case 'course-enrollment':
          await reportsAPI.generateCourseEnrollment(apiDateRange);
          break;
        case 'financial-summary':
          await reportsAPI.generateFinancialSummary(apiDateRange);
          break;
        default:
          alert('Invalid report selected.');
      }
    } catch (error) {
      alert(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    // This would typically download the generated report
    console.log('Downloading report:', selectedReport);
    alert(`Downloading report: ${selectedReport}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Report Type</h2>
          <div className="space-y-3">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Configuration</h2>
          
          {selectedReport ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End date"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                  disabled={!selectedReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Select a report type to configure</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Preview Area */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h2>
        {selectedReport ? (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {reportTypes.find(r => r.id === selectedReport)?.title}
            </h3>
            <p className="text-gray-500">Report preview will be shown here after generation</p>
            <p className="text-sm text-gray-400 mt-2">
              Date range: {dateRange.start || 'Start date'} to {dateRange.end || 'End date'}
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No report selected. Choose a report type to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManagement;
