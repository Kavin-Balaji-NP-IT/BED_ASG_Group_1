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
    const diet = await dietModel.getDietById(id);
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
    const newDiet = await dietModel.createDiet(req.body);
    res.status(201).json(newDiet);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Error creating diet plan" });
  }
}

module.exports = {
  getAllDiets,
  getDietById,
  createDiet,
};
