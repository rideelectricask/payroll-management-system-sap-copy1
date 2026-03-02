import { useState, useEffect } from 'react';
import { autoLogin, getDriverList } from '../services/authService';

export default function Scrappy() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const isAuthenticated = await autoLogin();
      
      if (!isAuthenticated) {
        throw new Error('Authentication failed');
      }

      const response = await getDriverList({ page });
      
      if (response && response.data && Array.isArray(response.data.driver_list_response)) {
        const driverData = response.data.driver_list_response.map(item => ({
          driver_id: item.drivers?.id,
          name: item.drivers?.name,
          phone_number: item.drivers?.phone_number,
          city: item.drivers?.city_name,
          status: item.drivers?.account_state?.status,
          attendance: item.drivers?.attendance_status,
          otp: item.drivers?.otp,
          bank_info_provided: item.bank_info_provided,
          app_version_name: item.drivers?.app_version_name,
          app_version_code: item.drivers?.app_version,
          app_android_version: item.drivers?.app_android_version,
          android_version: item.drivers?.android_version,
          last_active: item.drivers?.last_active,
          created_at: item.drivers?.created_at,
          registered_at: item.registered_at,
          hubs: item.hubs,
          businesses: item.businesses
        }));
        
        setDrivers(driverData);
        setTotalPages(response.data.total_pages || 1);
        setTotalRecords(response.data.total_records || 0);
      } else {
        setDrivers([]);
      }
      
      setError(null);
    } catch (err) {
      setError(err.message);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 30000);
    return () => clearInterval(interval);
  }, [page]);

  const getStatusDisplay = (status) => {
    const statusMap = {
      'registered': 'Registered',
      'active': 'Active',
      'pending': 'Pending Verification',
      'new': 'New',
      'inactive': 'Inactive'
    };
    return statusMap[status?.toLowerCase()] || status || '-';
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'active') return 'bg-green-100 text-green-800';
    if (normalizedStatus === 'pending' || normalizedStatus === 'pending verification') return 'bg-yellow-100 text-yellow-800';
    if (normalizedStatus === 'registered') return 'bg-purple-100 text-purple-800';
    if (normalizedStatus === 'new') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  };

  const parseCategories = (categoryString) => {
    if (!categoryString || categoryString === '') return [];
    return categoryString.split(',').map(c => c.trim());
  };

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No data available</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Driver List ({totalRecords.toLocaleString()} total drivers)
        </h1>
        <button
          onClick={fetchDrivers}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Driver ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Driver's Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Driver Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Attendance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">OTP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Bank Info Provided</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">App Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">App Ver. Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">App API Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Android Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Last Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Registered At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Hub Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Business Category</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {drivers.map((driver, index) => (
              <tr key={driver.driver_id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">{driver.driver_id || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{driver.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{driver.phone_number || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{driver.city || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(driver.status)}`}>
                    {getStatusDisplay(driver.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {driver.attendance ? (
                    <span className={`px-2 py-1 rounded text-xs ${
                      driver.attendance.toLowerCase() === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.attendance}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{driver.otp || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    driver.bank_info_provided ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {driver.bank_info_provided ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{driver.app_version_name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{driver.app_version_code || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{driver.app_android_version || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{driver.android_version || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(driver.last_active)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(driver.created_at)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTime(driver.registered_at)}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {parseCategories(driver.hubs).length > 0 ? (
                      parseCategories(driver.hubs).map((hub, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {hub}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {parseCategories(driver.businesses).length > 0 ? (
                      parseCategories(driver.businesses).map((business, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {business}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {page} of {totalPages} ({drivers.length} records)
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages || loading}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}