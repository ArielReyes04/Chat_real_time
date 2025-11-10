const bcrypt = require('bcrypt');
const userRepo = require('../repositories/user.repository');
const { signToken } = require('../config/jwt');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

async function register({ name, email, password }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 400;
    throw err;
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepo.createUser({ name, email, password: hash });
  const token = signToken({ sub: user.id, email: user.email });
  return { user, token };
}

async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const token = signToken({ sub: user.id, email: user.email });
  return { user: { id: user.id, name: user.name, email: user.email }, token };
}

module.exports = { register, login };