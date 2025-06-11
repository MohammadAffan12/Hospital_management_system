const express = require('express');
const router = express.Router();

// Placeholder routes until we implement the controller
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Medical Records API endpoint',
    data: {
      records: []
    }
  });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Medical Record details API endpoint',
    data: {
      record: {
        id: req.params.id,
        type: 'General'
      }
    }
  });
});

module.exports = router;
