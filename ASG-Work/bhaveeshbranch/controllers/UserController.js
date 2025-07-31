const bcrypt = require('bcrypt');
const UserModel = require('../models/UserModel');

const UserController = {
  getUserById: async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Hide password before sending
      delete user.password;
      return res.status(200).json(user);
    } catch (err) {
      console.error('getUserById error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateUser: async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { username, password, role } = req.body;
    const requestingUser = req.user;

    // Users can only update their own info unless they're an admin
    if (requestingUser.id !== userId && requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updatedData = {};

    if (username) updatedData.username = username;
    if (role && requestingUser.role === 'admin') updatedData.role = role;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedData.password = hashedPassword;
    }

    try {
      const updated = await UserModel.updateUser(userId, updatedData);
      if (updated) {
        return res.status(200).json({ message: 'User updated successfully' });
      } else {
        return res.status(404).json({ message: 'User not found or no changes made' });
      }
    } catch (err) {
      console.error('updateUser error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // --- NEW FUNCTION ADDED HERE ---
  getCurrentUser: async (req, res) => {
    try {
      // The verifyToken middleware should add the userId to the request object
      const userId = req.userId;
      
      const user = await UserModel.findById(userId); 
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Don't send the password back!
      const { password, ...userDetails } = user;

      return res.status(200).json(userDetails);

    } catch (error) {
      console.error('Error fetching current user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  // --- END OF NEW FUNCTION ---

  deleteUser: async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const requestingUser = req.user;

    // Only admins can delete users
    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete users' });
    }

    try {
      const deleted = await UserModel.deleteUser(userId);
      if (deleted) {
        return res.status(200).json({ message: 'User deleted successfully' });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (err) {
      console.error('deleteUser error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  adminChangePassword: async (req, res) => {
    const { username, newPassword } = req.body;
    const requestingUser = req.user;

    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can change passwords' });
    }

    try {
      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updated = await UserModel.updateUser(user.id, { password: hashedPassword });
      if (updated) {
        return res.status(200).json({ message: 'Password changed successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to update password' });
      }
    } catch (err) {
      console.error('adminChangePassword error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  deleteUserByUsername: async (req, res) => {
  const { username } = req.params;
  const requestingUser = req.user;

  if (requestingUser.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can delete users' });
  }

  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }

  try {
    const deleted = await UserModel.deleteUserByUsername(username);
    if (deleted) {
      return res.status(200).json({ message: 'User deleted successfully.' });
    } else {
      return res.status(404).json({ message: 'User not found.' });
    }
  } catch (err) {
    console.error('deleteUserByUsername error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

};

module.exports = UserController;