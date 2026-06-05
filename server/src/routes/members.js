const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getMembers, addMembers, deleteMember } = require('../controllers/membersController');

router.get('/trips/:tripId/members', asyncHandler(getMembers));
router.post('/trips/:tripId/members', asyncHandler(addMembers));
router.delete('/members/:id', asyncHandler(deleteMember));

module.exports = router;
