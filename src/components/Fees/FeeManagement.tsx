import React, { useEffect, useState } from 'react';
import { feesAPI } from '../../services/api';

interface FeeRecord {
  _id: string;
  student: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    admissionNo: string;
    departmentId: {
      _id: string;
      name: string;
    };
  };
  amount: number;
  status: string;
  dueDate: string;
  description: string;
  paidDate?: string;
}

const FeeManagement: React.FC = () => {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeeRecords = async () => {
      try {
        const data = await feesAPI.getAll(); // Get all fee records for admin view
        setFeeRecords(data);
      } catch (err) {
        setError('Failed to fetch fee data');
      } finally {
        setLoading(false);
      }
    };

    fetchFeeRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  // Calculate summary statistics
  const totalFees = feeRecords.reduce((sum, record) => sum + record.amount, 0);
  const paidFees = feeRecords
    .filter(record => record.status === 'paid')
    .reduce((sum, record) => sum + record.amount, 0);
  const pendingFees = feeRecords
    .filter(record => record.status === 'pending')
    .reduce((sum, record) => sum + record.amount, 0);
  const overdueFees = feeRecords
    .filter(record => record.status === 'overdue')
    .reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Fee Management Overview</h2>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800">Total Fees</h3>
          <p className="text-2xl font-bold text-blue-900">${totalFees.toLocaleString()}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-green-800">Amount Paid</h3>
          <p className="text-2xl font-bold text-green-900">${paidFees.toLocaleString()}</p>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-orange-800">Pending Fees</h3>
          <p className="text-2xl font-bold text-orange-900">${pendingFees.toLocaleString()}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-red-800">Overdue Fees</h3>
          <p className="text-2xl font-bold text-red-900">${overdueFees.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Fee Records */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Fee Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeRecords.slice(0, 5).map((record) => (
                <tr key={record._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.student.userId.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.student.admissionNo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.student.departmentId?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${record.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : record.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.dueDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {feeRecords.length === 0 && (
          <p className="text-gray-500 text-center py-4">No fee records found.</p>
        )}
      </div>
    </div>
  );
};

export default FeeManagement;
