import React, { useEffect, useState } from 'react';
import { paymentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Download, RefreshCw } from 'lucide-react';

interface PaymentRecord {
  _id: string;
  student: {
    _id: string;
    admissionNo: string;
    name: string;
    email: string;
  };
  amount: number;
  status: string;
  paymentMethod: string;
  transactionId: string;
  mpesaReceiptNumber: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

interface PaymentStats {
  summary: {
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
    successRate: string;
  };
  amounts: {
    totalAmount: number;
    completedAmount: number;
    pendingAmount: number;
  };
}

const PaymentReports: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPayments();
      fetchStats();
    }
  }, [user, filters, currentPage]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await paymentsAPI.getAllPayments(params);
      setPayments(response.payments);
      setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
    } catch (err: any) {
      console.error('Failed to fetch payment records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await paymentsAPI.getPaymentStats(filters);
      setStats(response);
    } catch (err) {
      console.error('Failed to fetch payment stats:', err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Admission No', 'Amount', 'Status', 'Payment Method', 'Transaction ID', 'Receipt Number', 'Created At', 'Completed At'];
    const csvData = payments.map(payment => [
      payment.student.name,
      payment.student.admissionNo,
      payment.amount,
      payment.status,
      payment.paymentMethod,
      payment.transactionId || 'N/A',
      payment.mpesaReceiptNumber || 'N/A',
      new Date(payment.createdAt).toLocaleDateString(),
      payment.completedAt ? new Date(payment.completedAt).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Access denied. Admin privileges required.
      </div>
    );
  }

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Payment Reports & Reconciliation</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchPayments}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Total Payments</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.summary.totalPayments}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Completed</h3>
            <p className="text-2xl font-bold text-green-900">{stats.summary.completedPayments}</p>
            <p className="text-sm text-green-700">KES {stats.amounts.completedAmount.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800">Pending</h3>
            <p className="text-2xl font-bold text-yellow-900">{stats.summary.pendingPayments}</p>
            <p className="text-sm text-yellow-700">KES {stats.amounts.pendingAmount.toLocaleString()}</p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-red-800">Failed</h3>
            <p className="text-2xl font-bold text-red-900">{stats.summary.failedPayments}</p>
            <p className="text-sm text-red-700">Success Rate: {stats.summary.successRate}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {payment.student.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.student.admissionNo}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    KES {payment.amount.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    payment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : payment.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.paymentMethod}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.transactionId || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.mpesaReceiptNumber || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments.length === 0 && !loading && (
        <p className="text-gray-500 text-center py-4">No payment records found.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default PaymentReports;
