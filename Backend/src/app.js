const express = require('express');
const cors = require('cors');
const db = require('./models');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth.routes');
const messageRoutes = require('./routes/message.routes');

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    database: db.sequelize ? 'connected' : 'disconnected'
  });
});

module.exports = app;