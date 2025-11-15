const app = require('./app');
const http = require('http');
const logger = require('./utils/logger');
const dotenv = require('dotenv');
const { initSocket } = require('./socket');
dotenv.config();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// inicializa socket.io
const io = initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});