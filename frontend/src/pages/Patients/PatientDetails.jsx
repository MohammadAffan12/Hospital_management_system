import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { patientsApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PatientForm from '../../components/patients/PatientForm';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [billing, setBilling] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        const response = await patientsApi.getById(id);
        
        if (response.success) {
          setPatient(response.data.patient);
          setAppointments(response.data.appointments);
          setMedicalRecords(response.data.medicalRecords);
          setBilling(response.data.billing);
          setAdmissions(response.data.admissions);
          setSummary(response.data.summary);
        } else {
          throw new Error(response.error || 'Failed to fetch patient details');
        }
      } catch (err) {
        console.error('Error fetching patient details:', err);
        setError('Failed to load patient details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [id]);

  const handleUpdatePatient = async (updatedData) => {
    try {
      setLoading(true);
      const response = await patientsApi.update(id, updatedData);
      
      if (response.success) {
        setPatient(response.data.patient);
        navigate(`/patients/${id}`);
      } else {
        throw new Error(response.error || 'Failed to update patient');
      }
    } catch (err) {
      console.error('Error updating patient:', err);
      setError('Failed to update patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    try {
      setLoading(true);
      const response = await patientsApi.delete(id);
      
      if (response.success) {
        navigate('/patients');
      } else {
        throw new Error(response.error || 'Failed to delete patient');
      }
    } catch (err) {
      console.error('Error deleting patient:', err);
      setError('Failed to delete patient. ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading && !patient) {
    return <LoadingSpinner />;
  }

  if (error && !patient) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => navigate('/patients')}
              className="mt-2 text-sm text-red-700 underline"
            >
              Back to patients list
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-600">Patient not found</p>
        <Link to="/patients" className="mt-4 text-blue-600 hover:underline">
          Back to patients list
        </Link>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Patient</h1>
          <button
            onClick={() => navigate(`/patients/${id}`)}
            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        <PatientForm 
          initialData={patient} 
          onSubmit={handleUpdatePatient} 
          isEditing={true}
          error={error}
        />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {patient.first_name} {patient.last_name}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/patients/${id}?edit=true`)}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Information</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient.first_name} {patient.last_name}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Gender</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.gender}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date of birth</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(patient.date_of_birth).toLocaleDateString()} (Age: {patient.age})
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.email || 'Not provided'}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.phone_number || 'Not provided'}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient.address || 'Not provided'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Patient Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-700">Appointments</p>
          <p className="mt-1 text-3xl font-semibold text-blue-900">{summary.totalAppointments || 0}</p>
        </div>
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-700">Medical Records</p>
          <p className="mt-1 text-3xl font-semibold text-green-900">{summary.totalMedicalRecords || 0}</p>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <p className="text-sm font-medium text-yellow-700">Billing Status</p>
          <p className="mt-1 text-3xl font-semibold text-yellow-900">${summary.outstandingBalance || '0.00'}</p>
          <p className="text-xs text-yellow-700">Outstanding balance</p>
        </div>
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-700">Admission Status</p>
          <p className="mt-1 text-xl font-semibold text-purple-900">
            {summary.currentlyAdmitted ? 'Currently Admitted' : 'Not Admitted'}
          </p>
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Appointments</h3>
          <Link
            to={`/appointments/add?patientId=${id}`}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Schedule
          </Link>
        </div>
        <div className="border-t border-gray-200 overflow-x-auto">
          {appointments.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(appointment.appointment_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{appointment.specialization}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${appointment.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                            appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/appointments/${appointment.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-4 text-gray-500">No appointments found</div>
          )}
        </div>
      </div>

      {/* Medical Records */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Medical Records</h3>
          <button
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={() => navigate(`/medical-records?patientId=${id}`)}
          >
            View All
          </button>
        </div>
        <div className="border-t border-gray-200">
          {medicalRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Treatment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicalRecords.slice(0, 5).map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(record.record_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{record.diagnosis}</td>
                      <td className="px-6 py-4">{record.treatment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No medical records found</div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePatient}
        title="Delete Patient"
        message={`Are you sure you want to delete ${patient.first_name} ${patient.last_name}? This action cannot be undone.`}
      />
    </div>
  );
};

export default PatientDetails;
