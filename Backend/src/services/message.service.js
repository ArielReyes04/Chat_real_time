const messageRepo = require('../repositories/message.repository');

async function sendMessage({ senderId, content, room }) {
  if (!content || content.trim() === '') {
    const err = new Error('Message content required');
    err.status = 400;
    throw err;
  }
  return messageRepo.createMessage({ senderId, content, room });
}

async function fetchMessages({ room = 'global', limit = 50 }) {
  return messageRepo.getRecentMessages(limit, room);
}

module.exports = { sendMessage, fetchMessages };