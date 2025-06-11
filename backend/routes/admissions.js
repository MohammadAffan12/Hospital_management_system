const express = require('express');
const router = express.Router();

// Placeholder routes until we implement the controller
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admissions API endpoint',
    data: {
      admissions: []
    }
  });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Admission details API endpoint',
    data: {
      admission: {
        id: req.params.id,
        status: 'Active'
      }
    }
  });
});

module.exports = router;
