const UserModel = require('../models/userModel');

const UserController = {
  getUserById: async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID." });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const { password, ...userProfile } = user;
      res.status(200).json(userProfile);

    } catch (error) {
      console.error("Error in getUserById:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  getCurrentUser: async (req, res) => {
    try {
      const userId = req.userId;
      
      const user = await UserModel.findById(userId); 
      if (!user) {
          return res.status(404).json({ message: 'User not found from token.' });
      }

      const { password, ...userDetails } = user;
      res.status(200).json(userDetails);

    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },


  updateUser: async (req, res) => {
    try {
      const userIdToUpdate = parseInt(req.params.id, 10);
      const requestingUserId = req.userId; 
      const requestingUserRole = req.userRole;
      
      if (requestingUserId !== userIdToUpdate && requestingUserRole !== 'admin') {
        return res.status(403).json({ message: "Forbidden: You do not have permission to update this user." });
      }

      const updatedData = req.body;
      
      if (updatedData.role && requestingUserRole !== 'admin') {
        delete updatedData.role;
      }

      const result = await UserModel.updateUser(userIdToUpdate, updatedData);
      
      if (!result) {
        return res.status(404).json({ message: "User not found or no changes made." });
      }

      res.status(200).json({ message: "User updated successfully." });

    } catch (error) {
      console.error("Error in updateUser:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userIdToDelete = parseInt(req.params.id, 10);
      const requestingUserRole = req.userRole;

      if (requestingUserRole !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Only admins can delete users." });
      }

      const result = await UserModel.deleteUser(userIdToDelete);

      if (!result) {
        return res.status(404).json({ message: "User not found." });
      }

      res.status(200).json({ message: "User deleted successfully." });

    } catch (error) {
      console.error("Error in deleteUser:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  }
};

module.exports = UserController;