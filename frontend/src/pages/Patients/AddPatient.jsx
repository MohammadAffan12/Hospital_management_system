import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { patientsApi } from '../../services/api';
import PatientForm from '../../components/patients/PatientForm';

const AddPatient = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleAddPatient = async (data) => {
    try {
      const response = await patientsApi.create(data);
      if (response.success) {
        navigate(`/patients/${response.data.patient.patient_id}`);
      } else {
        setError(response.error || 'Failed to create patient');
      }
    } catch (err) {
      console.error('Error adding patient:', err);
      setError('Failed to add patient. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add New Patient</h1>
        <Link
          to="/patients"
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>

      <PatientForm onSubmit={handleAddPatient} error={error} />
    </div>
  );
};

export default AddPatient;
