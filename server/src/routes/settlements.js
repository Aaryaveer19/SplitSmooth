const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getSettlements } = require('../controllers/settlementsController');

router.get('/trips/:tripId/settlements', asyncHandler(getSettlements));

module.exports = router;
