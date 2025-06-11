import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ChartBarIcon } from '../../icons';

// Import Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('month');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Define chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        caretSize: 5,
        cornerRadius: 6,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: '#e2e8f0'
        },
        ticks: {
          color: '#64748b'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    },
    cutout: '70%'
  };
  
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const params = { period: timeFilter };
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      
      const response = await analyticsApi.getAnalytics(params);
      
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch analytics data');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
      
      // Use mock data for development if API fails
      setAnalyticsData(getMockAnalyticsData());
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFilter]);
  
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchAnalyticsData();
  };
  
  const handleResetFilters = () => {
    setDateRange({
      startDate: '',
      endDate: ''
    });
  };

  // Generate mock data for development/preview
  const getMockAnalyticsData = () => {
    return {
      appointments: {
        byPeriod: [
          { period: '2023-01', total_appointments: 320, completed: 280, cancelled: 25, no_show: 15 },
          { period: '2023-02', total_appointments: 345, completed: 290, cancelled: 30, no_show: 25 },
          { period: '2023-03', total_appointments: 375, completed: 300, cancelled: 35, no_show: 40 },
          { period: '2023-04', total_appointments: 390, completed: 320, cancelled: 45, no_show: 25 },
          { period: '2023-05', total_appointments: 410, completed: 340, cancelled: 40, no_show: 30 },
          { period: '2023-06', total_appointments: 430, completed: 350, cancelled: 50, no_show: 30 },
        ],
        period: timeFilter
      },
      doctors: {
        performance: [
          { doctor_id: 1, first_name: 'John', last_name: 'Smith', specialization: 'Cardiology', total_appointments: 142, completed_appointments: 132, completion_rate: 93.0 },
          { doctor_id: 2, first_name: 'Sarah', last_name: 'Johnson', specialization: 'Neurology', total_appointments: 118, completed_appointments: 105, completion_rate: 89.0 },
          { doctor_id: 3, first_name: 'Robert', last_name: 'Williams', specialization: 'Pediatrics', total_appointments: 96, completed_appointments: 91, completion_rate: 94.8 },
          { doctor_id: 4, first_name: 'Mary', last_name: 'Brown', specialization: 'Orthopedics', total_appointments: 84, completed_appointments: 78, completion_rate: 92.9 },
          { doctor_id: 5, first_name: 'David', last_name: 'Miller', specialization: 'Dermatology', total_appointments: 75, completed_appointments: 68, completion_rate: 90.7 }
        ]
      },
      wards: {
        occupancy: [
          { ward_id: 1, ward_name: 'General', ward_type: 'General', capacity: 40, current_patients: 34, occupancy_rate: 85.0 },
          { ward_id: 2, ward_name: 'ICU', ward_type: 'Intensive Care', capacity: 25, current_patients: 24, occupancy_rate: 96.0 },
          { ward_id: 3, ward_name: 'Pediatric', ward_type: 'Pediatric', capacity: 30, current_patients: 21, occupancy_rate: 70.0 },
          { ward_id: 4, ward_name: 'Maternity', ward_type: 'Maternity', capacity: 20, current_patients: 15, occupancy_rate: 75.0 },
          { ward_id: 5, ward_name: 'Psychiatric', ward_type: 'Psychiatric', capacity: 28, current_patients: 23, occupancy_rate: 82.1 },
          { ward_id: 6, ward_name: 'Orthopedic', ward_type: 'Orthopedic', capacity: 32, current_patients: 25, occupancy_rate: 78.1 }
        ]
      }
    };
  };
  
  // Prepare chart data based on analytics data
  const getAppointmentsChartData = () => {
    if (!analyticsData?.appointments?.byPeriod) return null;
    
    const periods = analyticsData.appointments.byPeriod.map(item => 
      item.period.includes('-') ? item.period.split('-')[1] : item.period
    );
    
    return {
      labels: periods,
      datasets: [
        {
          label: 'Total',
          data: analyticsData.appointments.byPeriod.map(item => item.total_appointments),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.3
        },
        {
          label: 'Completed',
          data: analyticsData.appointments.byPeriod.map(item => item.completed),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgb(34, 197, 94)',
          tension: 0.3
        },
        {
          label: 'Cancelled',
          data: analyticsData.appointments.byPeriod.map(item => item.cancelled),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgb(239, 68, 68)',
          tension: 0.3
        }
      ]
    };
  };
  
  const getDoctorPerformanceData = () => {
    if (!analyticsData?.doctors?.performance) return null;
    
    return {
      labels: analyticsData.doctors.performance.map(doc => `Dr. ${doc.last_name}`),
      datasets: [
        {
          label: 'Completed',
          data: analyticsData.doctors.performance.map(doc => doc.completed_appointments),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
        },
        {
          label: 'Total',
          data: analyticsData.doctors.performance.map(doc => doc.total_appointments),
          backgroundColor: 'rgba(59, 130, 246, 0.7)'
        }
      ]
    };
  };
  
  const getWardOccupancyData = () => {
    if (!analyticsData?.wards?.occupancy) return null;
    
    return {
      labels: analyticsData.wards.occupancy.map(ward => ward.ward_name),
      datasets: [
        {
          label: 'Occupancy Rate (%)',
          data: analyticsData.wards.occupancy.map(ward => ward.occupancy_rate),
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(236, 72, 153, 0.7)'
          ]
        }
      ]
    };
  };

  const appointmentStatusData = () => {
    if (!analyticsData?.appointments?.byPeriod) return null;
    
    // Calculate totals from the most recent period
    const mostRecent = analyticsData.appointments.byPeriod[0] || {};
    
    return {
      labels: ['Completed', 'Cancelled', 'No-Show'],
      datasets: [
        {
          data: [
            mostRecent.completed || 0,
            mostRecent.cancelled || 0,
            mostRecent.no_show || 0
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(250, 204, 21, 0.7)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getTotalCompletionRate = () => {
    if (!analyticsData?.doctors?.performance) return 0;
    
    const total = analyticsData.doctors.performance.reduce((sum, doc) => sum + doc.total_appointments, 0);
    const completed = analyticsData.doctors.performance.reduce((sum, doc) => sum + doc.completed_appointments, 0);
    
    return total ? Math.round((completed / total) * 100) : 0;
  };
  
  const getAverageOccupancyRate = () => {
    if (!analyticsData?.wards?.occupancy) return 0;
    
    const total = analyticsData.wards.occupancy.reduce((sum, ward) => sum + ward.occupancy_rate, 0);
    return analyticsData.wards.occupancy.length ? Math.round(total / analyticsData.wards.occupancy.length) : 0;
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Comprehensive overview of hospital operations and performance metrics
          </p>
        </div>
      </div>
      
      {/* Filter section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Data Filters</h2>
        </div>
        
        <form onSubmit={handleFilterSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="timeFilter" className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <select
                id="timeFilter"
                name="timeFilter"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Appointment Completion Rate */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Appointment Completion Rate</span>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">{getTotalCompletionRate()}%</span>
                  </div>
                  <span className="text-sm text-gray-500">Completed vs Total Appointments</span>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            {/* Ward Occupancy */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Average Ward Occupancy</span>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">{getAverageOccupancyRate()}%</span>
                  </div>
                  <span className="text-sm text-gray-500">Across All Hospital Wards</span>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            {/* Doctor Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase">Top Doctor Performance</span>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      {analyticsData?.doctors?.performance?.[0]?.completion_rate || 0}%
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {analyticsData?.doctors?.performance?.[0]?.first_name} {analyticsData?.doctors?.performance?.[0]?.last_name}
                  </span>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointments Over Time Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Trends</h3>
              <div className="h-64">
                <Line 
                  data={getAppointmentsChartData() || {labels: [], datasets: []}} 
                  options={chartOptions} 
                />
              </div>
            </div>
            
            {/* Doctor Performance Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Doctor Performance</h3>
              <div className="h-64">
                <Bar 
                  data={getDoctorPerformanceData() || {labels: [], datasets: []}} 
                  options={chartOptions} 
                />
              </div>
            </div>
            
            {/* Ward Occupancy Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ward Occupancy Rates</h3>
              <div className="h-64">
                <Bar 
                  data={getWardOccupancyData() || {labels: [], datasets: []}} 
                  options={chartOptions}
                />
              </div>
            </div>
            
            {/* Appointment Status Distribution Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Status Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="w-48">
                  <Doughnut 
                    data={appointmentStatusData() || {labels: [], datasets: []}} 
                    options={doughnutOptions}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Detailed Tables Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Top Performing Doctors</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Appointments
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData?.doctors?.performance?.map(doctor => (
                    <tr key={doctor.doctor_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.specialization}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.total_appointments}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.completed_appointments}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {doctor.completion_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Ward Occupancy Details</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ward Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ward Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Patients
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occupancy Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData?.wards?.occupancy?.map(ward => (
                    <tr key={ward.ward_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ward.ward_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ward.ward_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ward.current_patients}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ward.capacity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ward.occupancy_rate > 90 ? 'bg-red-100 text-red-800' : 
                          ward.occupancy_rate > 70 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {ward.occupancy_rate}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
