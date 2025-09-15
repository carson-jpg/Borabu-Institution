const API_BASE_URL = 'https://borabu-institution-8.onrender.com/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  // Debug logging
  console.log('API Headers:', {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    authorizationHeader: headers.Authorization ? 'Present' : 'Missing'
  });

  return headers;
};

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const authHeaders = getAuthHeaders();
  const config: RequestInit = {
    headers: authHeaders,
    ...options
  };

  // Debug logging for each request
  console.log('API Request:', {
    url,
    method: config.method || 'GET',
    hasAuthHeader: !!(config.headers as any)?.Authorization,
    endpoint
  });

  try {
    const response = await fetch(url, config);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
      }

      return data;
    } else {
      // If not JSON, get the text response for debugging
      const textResponse = await response.text();
      console.error('Non-JSON response received:', textResponse.substring(0, 200));

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${textResponse.substring(0, 100)}`);
      }

      throw new Error('Server returned non-JSON response');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  register: async (userData: any) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  getCurrentUser: async () => {
    return apiRequest('/auth/current-user', {
      method: 'GET'
    });
  },
  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },
  verifyResetToken: async (token: string) => {
    return apiRequest(`/auth/reset-password/verify/${token}`, {
      method: 'GET'
    });
  },
  resetPassword: async (token: string, newPassword: string) => {
    return apiRequest(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword })
    });
  },
  // ... other methods
};

// Departments API
export const departmentsAPI = {
  getAll: async () => {
    return apiRequest('/departments');
  },
  // ... other methods
};

// Courses API
export const coursesAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/courses${queryString ? `?${queryString}` : ''}`);
  },
  // ... other methods
};

// Students API
export const studentsAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/students${queryString ? `?${queryString}` : ''}`);
  },
  getByUserId: async (userId: string) => {
    return apiRequest(`/students/user/${userId}`);
  },
  addCourse: async (studentId: string, courseData: any) => {
    return apiRequest(`/students/${studentId}/courses`, {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  },
  uploadTranscript: async (formData: FormData) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/students/upload-transcript`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Upload failed with status ${response.status}`);
    }

    return data;
  },
  uploadTranscriptsBatch: async (formData: FormData) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/students/upload-transcripts`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Batch upload failed with status ${response.status}`);
    }

    return data;
  },
  downloadTranscript: async (transcriptId: string, fileName: string) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/transcripts/download/${transcriptId}`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Download failed with status ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link and trigger the download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, message: 'Transcript downloaded successfully' };
    } catch (error) {
      console.error('Error downloading transcript:', error);
      throw error;
    }
  }
};

// Grades API
export const gradesAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/grades${queryString ? `?${queryString}` : ''}`);
  },
  create: async (gradeData: any) => {
    return apiRequest('/grades', {
      method: 'POST',
      body: JSON.stringify(gradeData)
    });
  },
  update: async (id: string, gradeData: any) => {
    return apiRequest(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gradeData)
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/grades/${id}`, {
      method: 'DELETE'
    });
  }
};

// Users API
export const usersAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/users${queryString ? `?${queryString}` : ''}`);
  },
  create: async (userData: any) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  update: async (id: string, userData: any) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  }
};

// Announcements API
export const announcementsAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/announcements${queryString ? `?${queryString}` : ''}`);
  },
  create: async (announcementData: any) => {
    return apiRequest('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData)
    });
  },
  update: async (id: string, announcementData: any) => {
    return apiRequest(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(announcementData)
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/announcements/${id}`, {
      method: 'DELETE'
    });
  }
};

// Fees API
export const feesAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/fees${queryString ? `?${queryString}` : ''}`);
  },
  getSummary: async (studentId: string) => {
    return apiRequest(`/fees/summary/${studentId}`);
  },
  create: async (feeData: any) => {
    return apiRequest('/fees', {
      method: 'POST',
      body: JSON.stringify(feeData)
    });
  },
  update: async (id: string, feeData: any) => {
    return apiRequest(`/fees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(feeData)
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/fees/${id}`, {
      method: 'DELETE'
    });
  },
  studentPayment: async (paymentData: any) => {
    return apiRequest('/fees/student-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }
};

// Payments API
export const paymentsAPI = {
  initiateMpesaPayment: async (paymentData: any) => {
    return apiRequest('/payments/mpesa/initiate', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },
  getPaymentStatus: async (paymentId: string) => {
    return apiRequest(`/payments/status/${paymentId}`);
  },
  getPaymentHistory: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/payments/history${queryString ? `?${queryString}` : ''}`);
  },
  getAllPayments: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/payments${queryString ? `?${queryString}` : ''}`);
  },
  getPaymentStats: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/payments/stats${queryString ? `?${queryString}` : ''}`);
  }
};

// Attendance API
export const attendanceAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/attendance${queryString ? `?${queryString}` : ''}`);
  },
  record: async (attendanceData: any) => {
    return apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    });
  },
  bulkRecord: async (bulkData: any) => {
    return apiRequest('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData)
    });
  },
  getUpcomingClasses: async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/attendance/upcoming${queryString ? `?${queryString}` : ''}`);
  },
};

// Transcripts API
export const transcriptsAPI = {
  getByStudentId: async (studentId: string) => {
    return apiRequest(`/transcripts/student/${studentId}`);
  },
  getByAdmissionNo: async (admissionNo: string) => {
    return apiRequest(`/transcripts/admission/${admissionNo}`);
  },
  download: async (transcriptId: string) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/transcripts/download/${transcriptId}`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Download failed with status ${response.status}`);
    }

    // Get the blob from the response
    const blob = await response.blob();

    // Get filename from response headers
    const contentDisposition = response.headers.get('content-disposition');
    let filename = 'transcript.pdf'; // default
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create a download link and trigger the download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, message: 'Transcript downloaded successfully' };
  }
};

// Timetables API
export const timetablesAPI = {
  getAll: async () => {
    return apiRequest('/timetables');
  },
  getByDepartmentAndYear: async (departmentId: string, year: number) => {
    return apiRequest(`/timetables/${departmentId}/${year}`);
  },
  getStudentTimetable: async (studentId: string) => {
    return apiRequest(`/timetables/student/${studentId}`);
  },
  create: async (timetableData: any) => {
    return apiRequest('/timetables', {
      method: 'POST',
      body: JSON.stringify(timetableData)
    });
  },
  update: async (id: string, timetableData: any) => {
    return apiRequest(`/timetables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timetableData)
    });
  },
  delete: async (id: string) => {
    return apiRequest(`/timetables/${id}`, {
      method: 'DELETE'
    });
  }
};

// Reports API
export const reportsAPI = {
  generateStudentPerformance: async (data: { startDate: string; endDate: string }) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/reports/student-performance`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Report generation failed with status ${response.status}`);
    }

    // Get the blob from the response
    const blob = await response.blob();

    // Create a download link and trigger the download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'student-performance-report.pdf';
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, message: 'Report downloaded successfully' };
  },

  generateAttendanceSummary: async (data: { startDate: string; endDate: string }) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/reports/attendance-summary`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Report generation failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'attendance-summary-report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, message: 'Report downloaded successfully' };
  },

  generateCourseEnrollment: async (data: { startDate: string; endDate: string }) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/reports/course-enrollment`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Report generation failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'course-enrollment-report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, message: 'Report downloaded successfully' };
  },

  generateFinancialSummary: async (data: { startDate: string; endDate: string }) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}/reports/financial-summary`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Report generation failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'financial-summary-report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, message: 'Report downloaded successfully' };
  }
};
