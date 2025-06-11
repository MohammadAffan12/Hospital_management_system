const express = require('express');
const wardsController = require('../controllers/wardsController');
const router = express.Router();

// GET /api/wards - Get all wards with occupancy statistics
router.get('/', wardsController.getAllWards);

// GET /api/wards/:id - Get ward by ID with current patients
router.get('/:id', wardsController.getWardById);

module.exports = router;
