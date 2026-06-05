const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getTrips, createTrip, getTripById, deleteTrip } = require('../controllers/tripsController');

router.get('/', asyncHandler(getTrips));
router.post('/', asyncHandler(createTrip));
router.get('/:id', asyncHandler(getTripById));
router.delete('/:id', asyncHandler(deleteTrip));

module.exports = router;
