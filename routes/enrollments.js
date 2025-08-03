const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Enrollments endpoint' });
});

module.exports = router;