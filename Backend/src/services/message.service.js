const messageRepo = require('../repositories/message.repository');
const { getIo } = require('../socket');

async function sendMessage({ senderId, content, room }) {
  if (!content || content.trim() === '') {
    const err = new Error('Message content required');
    err.status = 400;
    throw err;
  }
  const msg = await messageRepo.createMessage({ senderId, content, room });

  // emitir evento por socket a todos los clientes
  try {
    const io = getIo();
    io.emit('message', msg);
  } catch (e) {
    // socket no inicializado: loguear y continuar
    console.warn('Socket not available to emit message', e.message);
  }

  return msg;
}

async function fetchMessages({ room = 'global', limit = 50 }) {
  return messageRepo.getRecentMessages(limit, room);
}

module.exports = { sendMessage, fetchMessages };