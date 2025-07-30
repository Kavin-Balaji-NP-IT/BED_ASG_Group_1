const dietModel = require("../models/dietmodel");

async function getAllDiets(req, res) {
  try {
    const diets = await dietModel.getAllDiets();
    res.json(diets);
  } catch (error) {
    res.status(500).json({ error: "Failed to get diet plans" });
  }
}

// Get diet by ID
async function getDietById(req, res) {
  try {
    const id = parseInt(req.params.id);
    const diet = await dietModel.getDietPlanById(id);
    if (!diet) {
      return res.status(404).json({ error: "Diet plan not found" });
    }
    res.json(diet);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error retrieving diet plan" });
  }
}

// Create new diet
async function createDiet(req, res) {
  try {
    const newDiet = await dietModel.createDietPlan(req.body);
    res.status(201).json(newDiet);
  } catch (error) {
    console.error("Controller error in createDiet:", error);
    res.status(500).json({ error: "Error creating diet plan" });
  }
}

// Delete diet by ID
async function deleteDiet(req, res) {
  try {
    const id = parseInt(req.params.id);
    const deleted = await dietModel.deleteDietPlan(id);
    if (deleted) {
      res.json({ message: `Diet plan with ID ${id} deleted successfully.` });
    } else {
      res.status(404).json({ error: "Diet plan not found" });
    }
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error deleting diet plan" });
  }
}


// Update diet by ID
async function updateDiet(req, res) {
  try {
    const id = parseInt(req.params.id);
    const updatedDiet = await dietModel.updateDietPlan(id, req.body);
    if (updatedDiet) {
      res.json({ message: `Diet plan with ID ${id} updated successfully.`, data: updatedDiet });
    } else {
      res.status(404).json({ error: "Diet plan not found" });
    }
  } catch (error) {
    console.error("Controller error in updateDiet:", error);
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
