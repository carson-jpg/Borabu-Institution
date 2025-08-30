import React, { useEffect, useState } from 'react';
import { feesAPI, paymentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [studentFeeSummary, setStudentFeeSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  useEffect(() => {
    const fetchFeeRecords = async () => {
      try {
        if (user?.role === 'student') {
          // For students, fetch their specific fee summary
          const studentData = await feesAPI.getSummary(user.id);
          setStudentFeeSummary(studentData);
          // Also fetch their fee records
          const data = await feesAPI.getAll({ studentId: user.id });
          setFeeRecords(data);
        } else {
          // For admin, get all fee records
          const data = await feesAPI.getAll();
          setFeeRecords(data);
        }
      } catch (err) {
        setError('Failed to fetch fee data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFeeRecords();
    }
  }, [user]);

  const handlePayment = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setShowMpesaModal(true);
  };

  const handleMpesaPayment = async () => {
    if (!selectedFee || !phoneNumber) {
      alert('Please enter your phone number');
      return;
    }

    setPaymentLoading(true);
    try {
      const result = await paymentsAPI.initiateMpesaPayment({
        feeId: selectedFee._id,
        phoneNumber: phoneNumber,
        amount: selectedFee.amount
      });

      if (result.success) {
        setPaymentStatus({
          status: 'initiated',
          message: result.customerMessage,
          paymentId: result.paymentId
        });

        // Poll for payment status
        const pollPaymentStatus = async () => {
          try {
            const statusResult = await paymentsAPI.getPaymentStatus(result.paymentId);
            if (statusResult.status === 'completed') {
              setPaymentStatus({
                status: 'completed',
                message: 'Payment completed successfully!',
                receiptNumber: statusResult.mpesaReceiptNumber
              });
              // Refresh data after successful payment
              if (user?.role === 'student') {
                const studentData = await feesAPI.getSummary(user.id);
                setStudentFeeSummary(studentData);
                const data = await feesAPI.getAll({ studentId: user.id });
                setFeeRecords(data);
              }
            } else if (statusResult.status === 'failed') {
              setPaymentStatus({
                status: 'failed',
                message: 'Payment failed. Please try again.'
              });
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
          }
        };

        // Check status after 30 seconds
        setTimeout(pollPaymentStatus, 30000);
      } else {
        setPaymentStatus({
          status: 'failed',
          message: result.error || 'Failed to initiate payment'
        });
      }
    } catch (err: any) {
      setPaymentStatus({
        status: 'failed',
        message: err.message || 'Payment failed'
      });
    } finally {
      setPaymentLoading(false);
    }
  };

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
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {user?.role === 'student' ? 'My Fees & HELB Loan' : 'Fee Management Overview'}
      </h2>

      {/* HELB Loan Information for Students */}
      {user?.role === 'student' && studentFeeSummary?.helbLoan && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-3">HELB Loan Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-blue-800">Loan Amount</h4>
              <p className="text-lg font-bold text-blue-900">KES {studentFeeSummary.helbLoan.amount?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800">Status</h4>
              <p className={`text-lg font-bold ${
                studentFeeSummary.helbLoan.status === 'disbursed' ? 'text-green-900' :
                studentFeeSummary.helbLoan.status === 'approved' ? 'text-blue-900' :
                studentFeeSummary.helbLoan.status === 'pending' ? 'text-yellow-900' :
                'text-red-900'
              }`}>
                {studentFeeSummary.helbLoan.status?.charAt(0).toUpperCase() + studentFeeSummary.helbLoan.status?.slice(1) || 'Not Applied'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800">Loan Number</h4>
              <p className="text-lg font-bold text-blue-900">{studentFeeSummary.helbLoan.loanNumber || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
      
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

      {/* Fee Records */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {user?.role === 'student' ? 'My Fee Records' : 'Recent Fee Records'}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {user?.role !== 'student' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                )}
                {user?.role !== 'student' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
                {user?.role === 'student' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeRecords.slice(0, user?.role === 'student' ? 10 : 5).map((record) => (
                <tr key={record._id}>
                  {user?.role !== 'student' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.student.userId.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.student.admissionNo}
                      </div>
                    </td>
                  )}
                  {user?.role !== 'student' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.student.departmentId?.name || 'N/A'}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      KES {record.amount.toLocaleString()}
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
                  {user?.role === 'student' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status !== 'paid' && (
                        <button
                          onClick={() => handlePayment(record)}
                          disabled={paymentLoading}
                          className="bg-green-600 text-white px-3 py-1 text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {paymentLoading ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
                      {record.status === 'paid' && (
                        <span className="text-green-600 text-sm font-medium">Paid</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {feeRecords.length === 0 && (
          <p className="text-gray-500 text-center py-4">No fee records found.</p>
        )}
      </div>

      {/* M-Pesa Payment Modal */}
      {showMpesaModal && selectedFee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pay Fee via M-Pesa</h3>

              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">Fee Description: {selectedFee.description}</p>
                  <p className="text-lg font-bold text-gray-900">Amount: KES {selectedFee.amount.toLocaleString()}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the phone number registered with M-Pesa</p>
                </div>

                {paymentStatus && (
                  <div className={`mb-4 p-3 rounded-md ${
                    paymentStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                    paymentStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    <p className="text-sm">{paymentStatus.message}</p>
                    {paymentStatus.receiptNumber && (
                      <p className="text-xs mt-1">Receipt: {paymentStatus.receiptNumber}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowMpesaModal(false);
                      setSelectedFee(null);
                      setPhoneNumber('');
                      setPaymentStatus(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMpesaPayment}
                    disabled={paymentLoading || !phoneNumber}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentLoading ? 'Processing...' : 'Pay Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;
