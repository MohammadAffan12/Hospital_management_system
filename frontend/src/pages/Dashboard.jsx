import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi, analyticsApi } from '../services/api';
import { 
  UserGroupIcon, 
  UserMdIcon, 
  CalendarIcon, 
  BedIcon, 
  BellIcon,
  SearchIcon
} from '../icons';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
import { Line, Doughnut, Bar } from 'react-chartjs-2';

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

const Dashboard = () => {
  const [stats, setStats] = useState({
    patientCount: 1248,
    doctorCount: 42,
    appointmentsToday: 76,
    occupancyRate: 81,
    totalBeds: 180,
    occupiedBeds: 146
  });
  
  const [upcomingAppointments, setUpcomingAppointments] = useState([
    {
      appointment_id: 1,
      appointment_date: new Date(Date.now() + 3600000).toISOString(),
      patient_first_name: 'John',
      patient_last_name: 'Doe',
      doctor_first_name: 'Robert',
      doctor_last_name: 'Smith',
      specialization: 'Cardiology',
      hours_until_appointment: 1
    },
    {
      appointment_id: 2,
      appointment_date: new Date(Date.now() + 7200000).toISOString(),
      patient_first_name: 'Emma',
      patient_last_name: 'Wilson',
      doctor_first_name: 'Sarah',
      doctor_last_name: 'Jones',
      specialization: 'Neurology',
      hours_until_appointment: 2
    },
    {
      appointment_id: 3,
      appointment_date: new Date(Date.now() + 10800000).toISOString(),
      patient_first_name: 'Michael',
      patient_last_name: 'Brown',
      doctor_first_name: 'David',
      doctor_last_name: 'Clark',
      specialization: 'Orthopedics',
      hours_until_appointment: 3
    }
  ]);
  
  const [recentActivities] = useState([
    { id: 1, type: 'patient_registered', user: 'Emma Williams', time: '10 minutes ago', description: 'New patient registered' },
    { id: 2, type: 'appointment_completed', user: 'Dr. Mark Johnson', time: '25 minutes ago', description: 'Completed appointment with James Rodriguez' },
    { id: 3, type: 'discharge', user: 'Nurse Samantha', time: '1 hour ago', description: 'Discharged patient Thomas Wilson from Ward 4' },
    { id: 4, type: 'prescription', user: 'Dr. Sarah Smith', time: '2 hours ago', description: 'Created new prescription for patient Lisa Chen' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('week');
  
  // Patient distribution data
  const patientDistributionData = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [
      {
        data: [590, 650, 8],
        backgroundColor: ['rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(255, 206, 86, 0.7)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 206, 86, 1)'],
        borderWidth: 1,
      }
    ]
  };
  
  // Appointment status data
  const appointmentStatusData = {
    labels: ['Completed', 'Scheduled', 'Cancelled', 'No-Show'],
    datasets: [
      {
        data: [430, 280, 85, 45],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      }
    ]
  };

  // Monthly appointments data
  const appointmentsChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Appointments',
        data: [320, 340, 360, 330, 390, 420],
        fill: false,
        backgroundColor: 'rgb(59, 130, 246)',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        tension: 0.4,
      },
      {
        label: 'Completed',
        data: [280, 290, 300, 270, 320, 350],
        fill: false,
        backgroundColor: 'rgb(34, 197, 94)',
        borderColor: 'rgba(34, 197, 94, 0.8)',
        tension: 0.4,
      }
    ]
  };
  
  // Ward occupancy data
  const wardOccupancyData = {
    labels: ['General', 'ICU', 'Pediatric', 'Maternity', 'Psychiatric', 'Orthopedic'],
    datasets: [
      {
        label: 'Occupancy Rate (%)',
        data: [85, 96, 70, 75, 82, 78],
        backgroundColor: 'rgba(147, 51, 234, 0.7)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1
      }
    ]
  };

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // In a real application, we would fetch data from the API
        // const dashboardData = await analyticsApi.getDashboard();
        // setStats(dashboardData.data.stats);
        
        // const upcomingData = await appointmentsApi.getUpcoming({ limit: 5 });
        // setUpcomingAppointments(upcomingData.data.upcomingAppointments);
        
        // We're using mock data for now
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'patient_registered':
        return <div className="rounded-full bg-blue-100 p-2"><UserGroupIcon className="h-4 w-4 text-blue-600" /></div>;
      case 'appointment_completed':
        return <div className="rounded-full bg-green-100 p-2"><CalendarIcon className="h-4 w-4 text-green-600" /></div>;
      case 'discharge':
        return <div className="rounded-full bg-purple-100 p-2"><BedIcon className="h-4 w-4 text-purple-600" /></div>;
      case 'prescription':
        return <div className="rounded-full bg-orange-100 p-2"><UserMdIcon className="h-4 w-4 text-orange-600" /></div>;
      default:
        return <div className="rounded-full bg-gray-100 p-2"><BellIcon className="h-4 w-4 text-gray-600" /></div>;
    }
  };
  
  return (
    <div className="space-y-6 w-full">
      {/* Dashboard Header with Search and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center w-full">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold text-gray-800">
            Hospital Dashboard
          </h1>
          <p className="mt-1 text-gray-600">
            Welcome back! Here's what's happening today
          </p>
        </div>
        
        <div className="relative md:col-span-1">
          <div className="flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search patients, doctors..."
              />
            </div>
            <button className="flex items-center justify-center px-4 border border-l-0 border-gray-300 rounded-r-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Search
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <div className="w-full">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {/* Patient Card */}
            <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="px-5 py-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-tr from-blue-500 to-blue-400 p-3 rounded-lg shadow-blue-200 shadow-lg">
                    <UserGroupIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wider">Patients</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-bold text-gray-900">{stats.patientCount.toLocaleString()}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <svg className="self-center flex-shrink-0 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="sr-only">Increased by</span>
                          4.3%
                        </div>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">from last month</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 px-5 py-3 border-t border-blue-100">
                <Link to="/patients" className="text-sm font-medium text-blue-500 hover:text-blue-700">
                  View all patients →
                </Link>
              </div>
            </div>

            {/* Doctors Card */}
            <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="px-5 py-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-tr from-teal-500 to-teal-400 p-3 rounded-lg shadow-teal-200 shadow-lg">
                    <UserMdIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wider">Doctors</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-bold text-gray-900">{stats.doctorCount}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <svg className="self-center flex-shrink-0 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="sr-only">Increased by</span>
                          2.1%
                        </div>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">active specialists</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-teal-50 px-5 py-3 border-t border-teal-100">
                <Link to="/doctors" className="text-sm font-medium text-teal-500 hover:text-teal-700">
                  View all doctors →
                </Link>
              </div>
            </div>

            {/* Appointments Card */}
            <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="px-5 py-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-tr from-purple-500 to-purple-400 p-3 rounded-lg shadow-purple-200 shadow-lg">
                    <CalendarIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wider">Today's Appointments</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <svg className="self-center flex-shrink-0 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="sr-only">Increased by</span>
                          8.2%
                        </div>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">scheduled appointments</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 px-5 py-3 border-t border-purple-100">
                <Link to="/appointments" className="text-sm font-medium text-purple-500 hover:text-purple-700">
                  View all appointments →
                </Link>
              </div>
            </div>

            {/* Ward Occupancy Card */}
            <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="px-5 py-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-tr from-red-500 to-red-400 p-3 rounded-lg shadow-red-200 shadow-lg">
                    <BedIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 uppercase tracking-wider">Ward Occupancy</dt>
                      <dd>
                        <div className="flex items-baseline">
                          <div className="text-2xl font-bold text-gray-900">{stats.occupancyRate}%</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                            <svg className="self-center flex-shrink-0 h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="sr-only">Increased by</span>
                            3.5%
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {stats.occupiedBeds}/{stats.totalBeds} beds occupied
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 px-5 py-3 border-t border-red-100">
                <Link to="/wards" className="text-sm font-medium text-red-500 hover:text-red-700">
                  View all wards →
                </Link>
              </div>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
            {/* Appointments Trend Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-gray-800">Appointments Trend</h3>
                <div className="flex items-center space-x-2">
                  <button 
                    className={`px-3 py-1 text-xs font-medium rounded-full ${timeFilter === 'week' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setTimeFilter('week')}
                  >
                    Week
                  </button>
                  <button 
                    className={`px-3 py-1 text-xs font-medium rounded-full ${timeFilter === 'month' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setTimeFilter('month')}
                  >
                    Month
                  </button>
                  <button 
                    className={`px-3 py-1 text-xs font-medium rounded-full ${timeFilter === 'year' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setTimeFilter('year')}
                  >
                    Year
                  </button>
                </div>
              </div>
              <div className="h-64">
                <Line data={appointmentsChartData} options={chartOptions} />
              </div>
            </div>
            
            {/* Ward Occupancy Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-gray-800">Ward Occupancy</h3>
                <div className="text-xs font-medium text-gray-500">
                  Current Status
                </div>
              </div>
              <div className="h-64">
                <Bar data={wardOccupancyData} options={chartOptions} />
              </div>
            </div>
            
            {/* Patient Distribution Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-gray-800">Patient Demographics</h3>
                <div className="text-xs font-medium text-gray-500">
                  Gender Distribution
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                <div className="w-48">
                  <Doughnut data={patientDistributionData} options={doughnutOptions} />
                </div>
              </div>
            </div>
            
            {/* Appointment Status Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-gray-800">Appointment Status</h3>
                <div className="text-xs font-medium text-gray-500">
                  Last 30 days
                </div>
              </div>
              <div className="h-64 flex items-center justify-center">
                <div className="w-48">
                  <Doughnut data={appointmentStatusData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section - Upcoming Appointments and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mt-6">
            {/* Upcoming Appointments */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Upcoming Appointments</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment) => (
                    <Link
                      key={appointment.appointment_id}
                      to={`/appointments/${appointment.appointment_id}`}
                      className="block hover:bg-gray-50 transition-colors"
                    >
                      <div className="px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                              {appointment.patient_first_name.charAt(0)}{appointment.patient_last_name.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {appointment.patient_first_name} {appointment.patient_last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                with Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.specialization}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                              {new Date(appointment.appointment_date).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              in {Math.round(appointment.hours_until_appointment)} hour(s)
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="px-5 py-4 text-center text-gray-500">
                    No upcoming appointments
                  </div>
                )}
              </div>
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 text-right">
                <Link
                  to="/appointments"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  View all appointments
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="px-5 py-4">
                    <div className="flex">
                      {getActivityIcon(activity.type)}
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {activity.user}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 text-center">
                <button
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  View all activity →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
