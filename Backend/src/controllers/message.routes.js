// Este archivo actúa como controller de mensajes (nombre original en tu estructura)
const messageService = require('../services/message.service');

async function postMessage(req, res) {
  try {
    const senderId = req.user.id;
    const { content, room } = req.body;
    const message = await messageService.sendMessage({ senderId, content, room });
    res.status(201).json(message);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function getMessages(req, res) {
  try {
    const room = req.query.room || 'global';
    const limit = parseInt(req.query.limit || '50', 10);
    const messages = await messageService.fetchMessages({ room, limit });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { postMessage, getMessages };