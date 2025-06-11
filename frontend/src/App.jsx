import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// Page imports
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients/Patients';
import PatientDetails from './pages/Patients/PatientDetails';
import AddPatient from './pages/Patients/AddPatient';
import Doctors from './pages/Doctors/Doctors';
import DoctorDetails from './pages/Doctors/DoctorDetails';
import AddDoctor from './pages/Doctors/AddDoctor';
import Appointments from './pages/Appointments/Appointments';
import AppointmentDetails from './pages/Appointments/AppointmentDetails';
import AddAppointment from './pages/Appointments/AddAppointment';
import Wards from './pages/Wards/Wards';
import WardDetails from './pages/Wards/WardDetails';
import MedicalRecords from './pages/MedicalRecords/MedicalRecords';
import Analytics from './pages/Analytics/Analytics';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Dashboard */}
          <Route 
            path="/" 
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            } 
          />

          {/* Patients routes */}
          <Route 
            path="/patients" 
            element={
              <MainLayout>
                <Patients />
              </MainLayout>
            } 
          />
          <Route 
            path="/patients/:id" 
            element={
              <MainLayout>
                <PatientDetails />
              </MainLayout>
            } 
          />
          <Route 
            path="/patients/add" 
            element={
              <MainLayout>
                <AddPatient />
              </MainLayout>
            } 
          />

          {/* Doctors routes */}
          <Route 
            path="/doctors" 
            element={
              <MainLayout>
                <Doctors />
              </MainLayout>
            } 
          />
          <Route 
            path="/doctors/:id" 
            element={
              <MainLayout>
                <DoctorDetails />
              </MainLayout>
            } 
          />
          <Route 
            path="/doctors/add" 
            element={
              <MainLayout>
                <AddDoctor />
              </MainLayout>
            } 
          />

          {/* Appointments routes */}
          <Route 
            path="/appointments" 
            element={
              <MainLayout>
                <Appointments />
              </MainLayout>
            } 
          />
          <Route 
            path="/appointments/:id" 
            element={
              <MainLayout>
                <AppointmentDetails />
              </MainLayout>
            } 
          />
          <Route 
            path="/appointments/add" 
            element={
              <MainLayout>
                <AddAppointment />
              </MainLayout>
            } 
          />

          {/* Wards routes */}
          <Route 
            path="/wards" 
            element={
              <MainLayout>
                <Wards />
              </MainLayout>
            } 
          />
          <Route 
            path="/wards/:id" 
            element={
              <MainLayout>
                <WardDetails />
              </MainLayout>
            } 
          />

          {/* Medical Records route */}
          <Route 
            path="/medical-records" 
            element={
              <MainLayout>
                <MedicalRecords />
              </MainLayout>
            } 
          />

          {/* Analytics route */}
          <Route 
            path="/analytics" 
            element={
              <MainLayout>
                <Analytics />
              </MainLayout>
            } 
          />

          {/* Catch-all route for 404 pages - keep any existing routes */}
          <Route 
            path="*" 
            element={
              <MainLayout>
                <div className="flex items-center justify-center h-screen">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page not found</p>
                    <a href="/" className="text-blue-600 hover:text-blue-800">Go back home</a>
                  </div>
                </div>
              </MainLayout>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
