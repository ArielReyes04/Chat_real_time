const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const messageRoutes = require('./routes/message.routes');
const bodyParser = require('express').json;
const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Chat real-time backend' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal error' });
});

module.exports = app;