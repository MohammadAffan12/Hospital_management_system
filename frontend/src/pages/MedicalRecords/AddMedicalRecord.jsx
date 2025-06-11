import React, { useState, useEffect } from 'react';
import { medicalRecordsApi, patientsApi, doctorsApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const AddMedicalRecord = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    diagnosis: '',
    treatment: '',
    record_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Mock patient data
  const mockPatients = [
    { id: 101, name: "Muhammad Ali" },
    { id: 102, name: "Ayesha Khan" },
    { id: 103, name: "Imran Ahmed" },
    { id: 104, name: "Fatima Malik" },
    { id: 105, name: "Hassan Raza" },
    { id: 106, name: "Saima Nawaz" },
    { id: 107, name: "Ahmed Rashid" }
  ];

  // Mock doctor data
  const mockDoctors = [
    { id: 201, name: "Dr. Asim Hussain", specialization: "Cardiology" },
    { id: 202, name: "Dr. Sana Tariq", specialization: "Pediatrics" },
    { id: 203, name: "Dr. Zafar Iqbal", specialization: "Orthopedics" },
    { id: 204, name: "Dr. Nadia Patel", specialization: "Neurology" }
  ];

  useEffect(() => {
    // Simulate API calls
    const fetchPatients = async () => {
      // Replace with API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockPatients);
        }, 500);
      });
    };

    const fetchDoctors = async () => {
      // Replace with API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockDoctors);
        }, 500);
      });
    };

    const loadData = async () => {
      try {
        setLoading(true);
        
        const patientsData = await fetchPatients();
        const doctorsData = await fetchDoctors();
        
        setPatients(patientsData);
        setDoctors(doctorsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Replace with API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate success/failure
          Math.random() > 0.2 ? resolve() : reject(new Error('Failed to add medical record'));
        }, 500);
      });
      
      navigate('/medical-records');
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Add Medical Record</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
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
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <select
              id="patient_id"
              name="patient_id"
              value={formData.patient_id}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700 mb-1">
              Doctor
            </label>
            <select
              id="doctor_id"
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.specialization})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
              Diagnosis
            </label>
            <textarea
              id="diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              rows="3"
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="treatment" className="block text-sm font-medium text-gray-700 mb-1">
              Treatment
            </label>
            <textarea
              id="treatment"
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              rows="3"
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="record_date" className="block text-sm font-medium text-gray-700 mb-1">
              Record Date
            </label>
            <input
              type="date"
              id="record_date"
              name="record_date"
              value={formData.record_date}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
            >
              Save Record
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddMedicalRecord;