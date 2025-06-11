const express = require('express');
const doctorController = require('../controllers/doctorController');  // Make sure this path matches the actual file location

const router = express.Router();

// GET /api/doctors - Get all doctors with pagination and search
router.get('/', doctorController.getAllDoctors);

// GET /api/doctors/specializations - Get all doctor specializations
router.get('/specializations', doctorController.getSpecializations);

// GET /api/doctors/:id - Get doctor by ID with all related data
router.get('/:id', doctorController.getDoctorById);

// POST /api/doctors - Create new doctor
router.post('/', doctorController.createDoctor);

// PUT /api/doctors/:id - Update doctor
router.put('/:id', doctorController.updateDoctor);

// DELETE /api/doctors/:id - Delete doctor
router.delete('/:id', doctorController.deleteDoctor);

module.exports = router;