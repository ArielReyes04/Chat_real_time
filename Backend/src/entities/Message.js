function toMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    content: row.content,
    room: row.room,
    createdAt: row.created_at
  };
}
module.exports = { toMessage };