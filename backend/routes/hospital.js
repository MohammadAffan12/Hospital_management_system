const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const router = express.Router();

// GET /api/hospital/dashboard - Get dashboard statistics
router.get('/dashboard', analyticsController.getDashboard);

// GET /api/hospital/analytics - Get detailed analytics
router.get('/analytics', analyticsController.getAnalytics);

module.exports = router;