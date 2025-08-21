const express = require('express');
const router = express.Router();
const { getTokenBalance, addTokens } = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

// All routes in this file are protected
router.use(authenticate);

router.get('/tokens', getTokenBalance);
router.post('/add-tokens', addTokens);

module.exports = router;
