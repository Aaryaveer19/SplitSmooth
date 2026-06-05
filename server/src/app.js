const express = require('express');
const cors = require('cors');

const tripsRouter = require('./routes/trips');
const membersRouter = require('./routes/members');
const eventsRouter = require('./routes/events');
const balancesRouter = require('./routes/balances');
const settlementsRouter = require('./routes/settlements');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SplitSmooth API', version: '1.0.0' });
});

// Routes
app.use('/api/trips', tripsRouter);
app.use('/api', membersRouter);
app.use('/api', eventsRouter);
app.use('/api', balancesRouter);
app.use('/api', settlementsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
