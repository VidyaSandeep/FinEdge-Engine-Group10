const express = require('express');
const router = express.Router();
router.use(express.json());

router.get('/health', (req, res) => {
    console.log('Health check endpoint hit');
  res.status(200).json({ status: 'OK' });
});
module.exports = router;