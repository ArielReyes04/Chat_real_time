const db = require('../config/database');
const { toUser } = require('../entities/User');

async function createUser({ name, email, password }) {
  const sql = `INSERT INTO "users"(name,email,password) VALUES($1,$2,$3) RETURNING *`;
  const values = [name, email, password];
  const res = await db.query(sql, values);
  return toUser(res.rows[0]);
}

async function findByEmail(email) {
  const sql = `SELECT * FROM "users" WHERE email = $1 LIMIT 1`;
  const res = await db.query(sql, [email]);
  if (!res.rows[0]) return null;
  return { ...toUser(res.rows[0]), password: res.rows[0].password };
}

async function findById(id) {
  const sql = `SELECT * FROM "users" WHERE id = $1 LIMIT 1`;
  const res = await db.query(sql, [id]);
  return toUser(res.rows[0]);
}

module.exports = { createUser, findByEmail, findById };