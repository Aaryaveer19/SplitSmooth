const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { getMembers, addMembers, deleteMember } = require('../controllers/membersController');
const { getMemberAnalytics } = require('../controllers/memberAnalyticsController');

router.get('/trips/:tripId/members', asyncHandler(getMembers));
router.post('/trips/:tripId/members', asyncHandler(addMembers));
router.delete('/members/:id', asyncHandler(deleteMember));
router.get('/members/:id/analytics', asyncHandler(getMemberAnalytics));

module.exports = router;
