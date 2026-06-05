const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getBalances } = require('../controllers/balancesController');

router.get('/trips/:tripId/balances', asyncHandler(getBalances));

module.exports = router;
