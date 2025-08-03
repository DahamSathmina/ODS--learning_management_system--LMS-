const express = require('express');
const router = express.Router();

// Add your existing routes here
router.get('/', (req, res) => {
  res.json({ message: 'Users endpoint working' });
});

// IMPORTANT: Make sure you have this at the end
module.exports = router;