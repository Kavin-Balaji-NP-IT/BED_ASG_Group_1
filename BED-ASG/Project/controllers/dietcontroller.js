const dietModel = require("../models/dietmodel");

// Get all diets for authenticated user
async function getAllDiets(req, res) {
  try {
    console.log("User ID in getAllDiets:", req.user.userId);
    const diets = await dietModel.getDietPlansByUserId(req.user.userId);
    res.json(diets);
  } catch (error) {
    console.error("Error getting user diets:", error);
    res.status(500).json({ error: "Failed to get diet plans" });
  }
}

// Get diet by MealID (only if belongs to user)
async function getDietById(req, res) {
  try {
    const id = parseInt(req.params.id);
    console.log("User ID in getDietById:", req.user.userId);
    const diet = await dietModel.getDietPlanById(id);
    if (!diet) return res.status(404).json({ error: "Diet plan not found" });
    if (diet.UserID !== req.user.userId)
      return res.status(403).json({ error: "Access denied." });
    res.json(diet);
  } catch (error) {
    console.error("Error in getDietById:", error);
    res.status(500).json({ error: "Error retrieving diet plan" });
  }
}

// Create new diet for user
async function createDiet(req, res) {
  try {
    console.log("User ID in createDiet:", req.user.userId);
    const dietData = { ...req.body, UserID: req.user.userId };
    const newDiet = await dietModel.createDietPlan(dietData);
    res.status(201).json(newDiet);
  } catch (error) {
    console.error("Error in createDiet:", error);
    res.status(500).json({ error: "Error creating diet plan" });
  }
}

// Delete diet by MealID
async function deleteDiet(req, res) {
  try {
    const id = parseInt(req.params.id);
    console.log("User ID in deleteDiet:", req.user.userId);
    const diet = await dietModel.getDietPlanById(id);
    if (!diet) return res.status(404).json({ error: "Diet plan not found" });
    if (diet.UserID !== req.user.userId)
      return res.status(403).json({ error: "Access denied." });
    const deleted = await dietModel.deleteDietPlan(id);
    if (deleted)
      res.json({ message: `Diet plan with ID ${id} deleted successfully.` });
    else res.status(500).json({ error: "Error deleting diet plan" });
  } catch (error) {
    console.error("Error in deleteDiet:", error);
    res.status(500).json({ error: "Error deleting diet plan" });
  }
}

// Update diet by MealID
async function updateDiet(req, res) {
  try {
    const id = parseInt(req.params.id);
    console.log("User ID in updateDiet:", req.user.userId);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid MealID" });
    }

    const existing = await dietModel.getDietPlanById(id);
    if (!existing) return res.status(404).json({ error: "Diet plan not found" });
    if (existing.UserID !== req.user.userId)
      return res.status(403).json({ error: "Access denied." });

    // Extract only allowed fields from req.body
    const { MealName, Calories, MealType, MealDate, Notes } = req.body;
    const updateData = { MealName, Calories, MealType, MealDate, Notes };

    const updated = await dietModel.updateDietPlan(id, updateData);
    if (updated)
      res.json({ message: `Diet plan with ID ${id} updated successfully.`, data: updated });
    else res.status(500).json({ error: "Error updating diet plan" });
  } catch (error) {
    console.error("Error in updateDiet:", error);
    res.status(500).json({ error: "Error updating diet plan" });
  }
}


module.exports = {
  getAllDiets,
  getDietById,
  createDiet,
  deleteDiet,
  updateDiet,
};
