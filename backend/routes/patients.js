const express = require('express');
const patientController = require('../controllers/PatientController');

const router = express.Router();

// GET /api/patients - Get all patients with pagination and search
router.get('/', patientController.getAllPatients);

// GET /api/patients/:id - Get patient by ID with all related data
router.get('/:id', patientController.getPatientById);

// POST /api/patients - Create new patient
router.post('/', patientController.createPatient);

// PUT /api/patients/:id - Update patient
router.put('/:id', patientController.updatePatient);

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', patientController.deletePatient);

module.exports = router;