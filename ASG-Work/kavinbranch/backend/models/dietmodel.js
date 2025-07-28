const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all diet plans
async function getAllDiets() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT 
        MealID, UserID, MealName, Calories, MealType, MealDate, Notes 
      FROM DietPlan
    `;
    const result = await connection.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Get diet plan by ID
async function getDietPlanById(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT 
        MealID, UserID, MealName, Calories, MealType, MealDate, Notes 
      FROM DietPlan 
      WHERE DietPlanID = @id
    `;
    const request = connection.request();
    request.input("id", id);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null; // Not found
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Create new diet plan
async function createDietPlan(dietData) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO DietPlan (UserID, MealName, Calories, MealType, MealDate, Notes) 
      VALUES (@UserID, @MealName, @Calories, @MealType, @MealDate, @Notes); 
      SELECT SCOPE_IDENTITY() AS id;
    `;
    const request = connection.request();
    request.input("UserID", dietData.UserID);
    request.input("MealName", dietData.MealName);
    request.input("Calories", dietData.Calories);
    request.input("MealType", dietData.MealType);
    request.input("MealDate", dietData.MealDate);
    request.input("Notes", dietData.Notes);

    const result = await request.query(query);
    const newDietId = result.recordset[0].id;
    return await getDietPlanById(newDietId);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = {
  getAllDiets,
  getDietPlanById,
  createDietPlan,
};
