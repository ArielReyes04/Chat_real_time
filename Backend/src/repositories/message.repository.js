const db = require('../config/database');
const { toMessage } = require('../entities/Message');

async function createMessage({ senderId, content, room = 'global' }) {
  const sql = `INSERT INTO "messages"(sender_id, content, room) VALUES($1,$2,$3) RETURNING *`;
  const res = await db.query(sql, [senderId, content, room]);
  return toMessage(res.rows[0]);
}

async function getRecentMessages(limit = 50, room = 'global') {
  const sql = `SELECT * FROM "messages" WHERE room = $1 ORDER BY created_at DESC LIMIT $2`;
  const res = await db.query(sql, [room, limit]);
  return res.rows.map(toMessage).reverse();
}

module.exports = { createMessage, getRecentMessages };