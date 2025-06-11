import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { medicalRecordsApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ArrowLeftIcon } from '../../icons';

const MedicalRecordDetails = () => {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecordDetails = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordsApi.getRecordById(id);
      
      if (response.success) {
        setRecord(response.data.record);
      } else {
        throw new Error(response.error || 'Failed to fetch record details');
      }
    } catch (err) {
      console.error('Error fetching record details:', err);
      setError('Failed to load record details. Please try again later.');
      
      // Use mock data for development if API fails
      setRecord(mockMedicalRecord);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordDetails();
  }, [id]);

  // Update mock data with Pakistani names
  const mockMedicalRecord = {
    id: 1,
    patient: {
      id: 101,
      name: "Muhammad Ali",
      age: 45,
      gender: "Male",
      phone: "0311-2345678",
      email: "m.ali@example.com",
      address: "House #123, Street 5, F-7/3, Islamabad"
    },
    diagnosis: "Hypertension",
    treatment: "Prescribed ACE inhibitors and recommended lifestyle changes",
    date: "2023-06-10",
    doctor: {
      id: 201,
      name: "Dr. Asim Hussain",
      specialization: "Cardiology"
    },
    history: [
      {
        date: "2023-05-15",
        diagnosis: "Initial hypertension evaluation",
        treatment: "Lifestyle modification advice given"
      },
      {
        date: "2023-04-02",
        diagnosis: "Annual checkup",
        treatment: "No significant issues identified"
      }
    ],
    vitals: {
      bloodPressure: "150/95 mmHg",
      heartRate: "82 bpm",
      temperature: "36.8°C",
      respiratoryRate: "16/min",
      oxygenSaturation: "98%"
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-800">
        {error}
      </div>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Back button */}
      <div className="mb-4">
        <Link to="/medical-records" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Medical Records
        </Link>
      </div>
      
      {/* Record details */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Medical Record Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient information */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Patient Information</h3>
          <div className="text-sm text-gray-700">
            <p><strong>Name:</strong> {record.patient.name}</p>
            <p><strong>Age:</strong> {record.patient.age}</p>
            <p><strong>Gender:</strong> {record.patient.gender}</p>
            <p><strong>Phone:</strong> {record.patient.phone}</p>
            <p><strong>Email:</strong> {record.patient.email}</p>
            <p><strong>Address:</strong> {record.patient.address}</p>
          </div>
        </div>
        
        {/* Doctor information */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Doctor Information</h3>
          <div className="text-sm text-gray-700">
            <p><strong>Name:</strong> {record.doctor.name}</p>
            <p><strong>Specialization:</strong> {record.doctor.specialization}</p>
          </div>
        </div>
      </div>
      
      {/* Medical record details */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Record Details</h3>
        <div className="text-sm text-gray-700">
          <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
          <p><strong>Treatment:</strong> {record.treatment}</p>
          <p><strong>Date:</strong> {new Date(record.date).toLocaleDateString()}</p>
        </div>
      </div>
      
      {/* Medical history */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Medical History</h3>
        <div className="space-y-2">
          {record.history.map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">
                <strong>{new Date(item.date).toLocaleDateString()}:</strong> {item.diagnosis} - {item.treatment}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Vitals */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Vitals</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Blood Pressure</p>
            <p className="text-lg font-bold text-gray-800">{record.vitals.bloodPressure}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Heart Rate</p>
            <p className="text-lg font-bold text-gray-800">{record.vitals.heartRate}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Temperature</p>
            <p className="text-lg font-bold text-gray-800">{record.vitals.temperature}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Respiratory Rate</p>
            <p className="text-lg font-bold text-gray-800">{record.vitals.respiratoryRate}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Oxygen Saturation</p>
            <p className="text-lg font-bold text-gray-800">{record.vitals.oxygenSaturation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordDetails;