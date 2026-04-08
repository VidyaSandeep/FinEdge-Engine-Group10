const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/userController');

// POST /users - Register new user
router.post('/', registerUser);

module.exports = router;