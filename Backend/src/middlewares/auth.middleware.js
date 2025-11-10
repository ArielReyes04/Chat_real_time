const { verifyToken } = require('../config/jwt');
const userRepo = require('../repositories/user.repository');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization required' });
    }
    const token = header.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload || !payload.sub) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const user = await userRepo.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
}

module.exports = { requireAuth };