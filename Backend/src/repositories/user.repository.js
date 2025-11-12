const { User } = require('../models');

class UserRepository {
  async findByUsername(username) {
    return await User.findOne({ where: { username } });
  }

  async create(userData) {
    return await User.create(userData);
  }

  async findById(id) {
    return await User.findByPk(id);
  }
}

module.exports = new UserRepository();