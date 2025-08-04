const sql = require("mssql");
const dbConfig = require("../dbconfig");

// Get all diet plans for all users (rarely needed, usually for admin)
async function getAllDiets() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT MealID, UserID, MealName, Calories, MealType, MealDate, Notes
      FROM DietPlan
    `;
    const result = await connection.request().query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getAllDiets:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get all diet plans by user ID
async function getDietPlansByUserId(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT MealID, UserID, MealName, Calories, MealType, MealDate, Notes
      FROM DietPlan
      WHERE UserID = @UserID
      ORDER BY MealDate DESC
    `;
    const result = await connection
      .request()
      .input("UserID", sql.Int, userId)
      .query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error in getDietPlansByUserId:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Get a single diet plan by MealID
async function getDietPlanById(MealID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("MealID", sql.Int, MealID)
      .query(`SELECT * FROM DietPlan WHERE MealID = @MealID`);
    return result.recordset[0]; // single object or undefined
  } catch (error) {
    console.error("Database error in getDietPlanById:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Create a new diet plan
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
    console.error("Database error in createDietPlan:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Delete diet plan by MealID
async function deleteDietPlan(MealID) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("MealID", sql.Int, MealID)
      .query(`DELETE FROM DietPlan WHERE MealID = @MealID`);
    return result.rowsAffected[0] > 0; // true if deleted
  } catch (error) {
    console.error("Database error in deleteDietPlan:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// Update diet plan by MealID
async function updateDietPlan(MealID, dietData) {
  const { MealName, Calories, MealType, MealDate, Notes } = dietData; // no UserID here
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const result = await connection
      .request()
      .input("MealID", sql.Int, MealID)
      .input("MealName", sql.NVarChar(100), MealName)
      .input("Calories", sql.Int, Calories)
      .input("MealType", sql.NVarChar(50), MealType)
      .input("MealDate", sql.Date, MealDate)
      .input("Notes", sql.NVarChar(sql.MAX), Notes)
      .query(`
        UPDATE DietPlan
        SET MealName = @MealName,
            Calories = @Calories,
            MealType = @MealType,
            MealDate = @MealDate,
            Notes = @Notes
        WHERE MealID = @MealID;
      `);
    if (result.rowsAffected[0] === 0) return null;
    return { MealID, ...dietData };
  } catch (error) {
    console.error("Database error in updateDietPlan:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllDiets,
  getDietPlansByUserId,
  getDietPlanById,
  createDietPlan,
  deleteDietPlan,
  updateDietPlan,
};
