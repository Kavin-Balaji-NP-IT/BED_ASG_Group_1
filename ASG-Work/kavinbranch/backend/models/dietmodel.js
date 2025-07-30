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
  const { UserID, MealName, Calories, MealType, MealDate, Notes } = dietData;
  let connection;

  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("UserID", sql.Int, UserID)
      .input("MealName", sql.NVarChar(100), MealName)
      .input("Calories", sql.Int, Calories)
      .input("MealType", sql.NVarChar(50), MealType)
      .input("MealDate", sql.Date, MealDate)
      .input("Notes", sql.NVarChar(sql.MAX), Notes)
      .query(`
        INSERT INTO DietPlan (UserID, MealName, Calories, MealType, MealDate, Notes)
        VALUES (@UserID, @MealName, @Calories, @MealType, @MealDate, @Notes);

        SELECT SCOPE_IDENTITY() AS MealID;
      `);

    const newId = result.recordset[0].MealID;
    return { MealID: newId, ...dietData };

  } catch (error) {
    console.error("Database error in createDiet:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Delete diet plan by ID
async function deleteDietPlan(id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
    DELETE FROM DietPlan 
    WHERE MealID = @id
    `;
    const request = connection.request();
    request.input("id", sql.Int, id);

    const result = await request.query(query);

    return result.rowsAffected[0] > 0; // true if a row was deleted
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
  deleteDietPlan,
};
