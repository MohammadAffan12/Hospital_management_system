import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { wardsApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const WardDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [ward, setWard] = useState(null);
  const [currentPatients, setCurrentPatients] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWardDetails();
  }, [id]);

  const fetchWardDetails = async () => {
    try {
      setLoading(true);
      const response = await wardsApi.getById(id);
      
      if (response.success) {
        setWard(response.data.ward);
        setCurrentPatients(response.data.currentPatients || []);
        setRecentHistory(response.data.recentHistory || []);
      } else {
        throw new Error(response.error || 'Failed to fetch ward details');
      }
    } catch (err) {
      console.error('Error fetching ward details:', err);
      setError('Failed to load ward details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyClass = (current, capacity) => {
    const rate = (current / capacity) * 100;
    if (rate < 50) return 'text-green-600';
    if (rate < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOccupancyBarClass = (current, capacity) => {
    const rate = (current / capacity) * 100;
    if (rate < 50) return 'bg-green-500';
    if (rate < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => navigate('/wards')}
          className="mt-2 text-sm text-red-700 underline"
        >
          Back to wards list
        </button>
      </div>
    );
  }

  if (!ward) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-600">Ward not found</p>
        <Link to="/wards" className="mt-4 text-blue-600 hover:underline">
          Back to wards list
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {ward.ward_name} - {ward.ward_type}
        </h1>
        <Link
          to="/wards"
          className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Wards
        </Link>
      </div>

      {/* Ward Overview Card */}
      <div className="bg-white p-6 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ward Info</h3>
            <p className="text-gray-600">Type: {ward.ward_type}</p>
            <p className="text-gray-600">ID: {ward.ward_id}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Capacity</h3>
            <p className="text-3xl font-bold">{ward.capacity} beds</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Current Occupancy</h3>
            <p className={`text-3xl font-bold ${getOccupancyClass(ward.current_occupancy, ward.capacity)}`}>
              {ward.current_occupancy}/{ward.capacity} beds
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
              <div 
                className={`h-4 rounded-full ${getOccupancyBarClass(ward.current_occupancy, ward.capacity)}`} 
                style={{width: `${(ward.current_occupancy / ward.capacity) * 100}%`}}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {ward.available_beds} beds available
            </p>
          </div>
        </div>
      </div>

      {/* Current Patients */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-900">Current Patients</h2>
        </div>
        <div className="overflow-x-auto">
          {currentPatients.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admission Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Admitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPatients.map((patient) => (
                  <tr key={patient.admission_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.patient_first_name} {patient.patient_last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.patient_phone}</div>
                      <div className="text-sm text-gray-500">{patient.patient_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.patient_gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(patient.admission_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.days_admitted} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/patients/${patient.patient_id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Patient
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No patients currently admitted to this ward
            </div>
          )}
        </div>
      </div>

      {/* Recent Admissions History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-900">Recent Admissions History</h2>
        </div>
        <div className="overflow-x-auto">
          {recentHistory.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admission Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discharge Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Length of Stay
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentHistory.map((admission) => (
                  <tr key={admission.admission_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {admission.patient_first_name} {admission.patient_last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(admission.admission_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {admission.discharge_date 
                          ? new Date(admission.discharge_date).toLocaleDateString() 
                          : 'Still admitted'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {admission.length_of_stay ? `${admission.length_of_stay} days` : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No admission history found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WardDetails;
