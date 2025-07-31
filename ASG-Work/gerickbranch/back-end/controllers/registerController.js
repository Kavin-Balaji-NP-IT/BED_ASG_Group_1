const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');

const RegisterController = {
  register: async (req, res) => {
    const { username, password, role = 'user' } = req.body;

    try {
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        username,
        password: hashedPassword,
        role
      };

      const created = await UserModel.createUser(newUser);

      if (created) {
        return res.status(201).json({ message: 'User registered successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to register user' });
      }
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = RegisterController;