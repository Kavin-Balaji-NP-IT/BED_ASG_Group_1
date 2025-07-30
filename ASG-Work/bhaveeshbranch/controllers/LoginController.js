const jwt = require('jsonwebtoken');
const LoginModel = require('../models/UserModel');

const LoginController = {
  login: async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await LoginModel.findByUsername(username);

      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const isPasswordValid = await LoginModel.validatePassword(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
       process.env.JWT_SECRET,
      { expiresIn: '1h' }
);


      return res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = LoginController;
