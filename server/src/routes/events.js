const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getEvents, getEventById, createEvent, deleteEvent } = require('../controllers/eventsController');

router.get('/trips/:tripId/events', asyncHandler(getEvents));
router.post('/trips/:tripId/events', asyncHandler(createEvent));
router.get('/events/:id', asyncHandler(getEventById));
router.delete('/events/:id', asyncHandler(deleteEvent));

module.exports = router;
