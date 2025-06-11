import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { appointmentsApi, doctorsApi, patientsApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { SearchIcon } from '../../icons';

const AddAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || '';
  const initialDoctorId = searchParams.get('doctorId') || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: initialPatientId,
    doctor_id: initialDoctorId,
    appointment_date: '',
    status: 'Scheduled',
    notes: ''
  });

  useEffect(() => {
    if (initialPatientId) {
      fetchPatientDetails(initialPatientId);
    }
    
    fetchDoctors();
    fetchSpecializations();
  }, [initialPatientId, initialDoctorId]);

  const fetchPatientDetails = async (id) => {
    try {
      const response = await patientsApi.getById(id);
      if (response.success) {
        setPatients([{
          patient_id: response.data.patient.patient_id,
          first_name: response.data.patient.first_name,
          last_name: response.data.patient.last_name,
          phone_number: response.data.patient.phone_number
        }]);
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await doctorsApi.getSpecializations();
      if (response.success) {
        setSpecializations(response.data.specializations);
      }
    } catch (err) {
      console.error('Error fetching specializations:', err);
    }
  };

  const fetchDoctors = async (specialization = '') => {
    try {
      const params = { limit: 50 };
      if (specialization) {
        params.specialization = specialization;
      }
      if (initialDoctorId) {
        params.id = initialDoctorId;
      }
      
      const response = await doctorsApi.getAll(params);
      if (response.success) {
        setDoctors(response.data.doctors);
        
        // If initial doctor ID was provided, select it
        if (initialDoctorId && response.data.doctors.length > 0) {
          const doctor = response.data.doctors.find(d => d.id === initialDoctorId);
          if (doctor) {
            setFormData(prev => ({
              ...prev,
              doctor_id: doctor.id
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const searchPatients = async () => {
    if (!patientSearchQuery.trim()) return;
    
    setIsSearchingPatients(true);
    try {
      const response = await patientsApi.getAll({
        search: patientSearchQuery,
        limit: 10
      });
      
      if (response.success) {
        setPatients(response.data.patients);
      }
    } catch (err) {
      console.error('Error searching patients:', err);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecializationChange = (e) => {
    const value = e.target.value;
    setSelectedSpecialization(value);
    fetchDoctors(value);
  };

  const handlePatientSearchChange = (e) => {
    setPatientSearchQuery(e.target.value);
  };

  const handlePatientSearchSubmit = (e) => {
    e.preventDefault();
    searchPatients();
  };

  const handleSelectPatient = (patient) => {
    setFormData(prev => ({
      ...prev,
      patient_id: patient.patient_id
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.patient_id) {
      setError('Please select a patient');
      return;
    }
    
    if (!formData.doctor_id) {
      setError('Please select a doctor');
      return;
    }
    
    if (!formData.appointment_date) {
      setError('Please select appointment date and time');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await appointmentsApi.create(formData);
      
      if (response.success) {
        navigate(`/appointments/${response.data.appointment.appointment_id}`);
      } else {
        throw new Error(response.error || 'Failed to create appointment');
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.message || 'Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Schedule New Appointment</h1>
        <Link
          to="/appointments"
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Patient Selection */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h2>
              
              {!formData.patient_id ? (
                <div>
                  <form onSubmit={handlePatientSearchSubmit} className="mb-4">
                    <label htmlFor="patientSearch" className="block text-sm font-medium text-gray-700 mb-1">
                      Search for a patient
                    </label>
                    <div className="flex">
                      <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="patientSearch"
                          value={patientSearchQuery}
                          onChange={handlePatientSearchChange}
                          placeholder="Search by name, email, or phone..."
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <button
                        type="submit"
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        Search
                      </button>
                    </div>
                  </form>

                  {isSearchingPatients ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <div className="overflow-y-auto max-h-60 border border-gray-200 rounded-md">
                      {patients.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {patients.map((patient) => (
                            <li key={patient.patient_id} className="p-3 hover:bg-gray-50">
                              <button
                                type="button"
                                onClick={() => handleSelectPatient(patient)}
                                className="w-full text-left"
                              >
                                <div className="flex justify-between">
                                  <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                                  <div className="text-sm text-gray-500">{patient.phone_number}</div>
                                </div>
                                <div className="text-sm text-gray-500">ID: {patient.patient_id}</div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="p-3 text-center text-gray-500">No patients found. Try searching above.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center p-3 border rounded-md bg-blue-50">
                  <div>
                    <p className="font-medium">
                      {patients.find(p => p.patient_id.toString() === formData.patient_id.toString())?.first_name || ''} {
                        patients.find(p => p.patient_id.toString() === formData.patient_id.toString())?.last_name || ''
                      }
                    </p>
                    <p className="text-sm text-gray-500">Patient ID: {formData.patient_id}</p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setFormData(prev => ({ ...prev, patient_id: '' }))}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Doctor Selection */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Doctor Information</h2>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <select
                    id="specialization"
                    value={selectedSpecialization}
                    onChange={handleSpecializationChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Specializations</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor *
                  </label>
                  <select
                    id="doctor_id"
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Appointment Details</h2>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="appointment_date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleInputChange}
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No-Show">No-Show</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Schedule Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAppointment;
