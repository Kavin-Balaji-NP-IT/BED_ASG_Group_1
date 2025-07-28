const path = require("path");
const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const cors = require("cors"); // ✅ CORS middleware

// Load environment variables
dotenv.config();

// Import controllers and middleware
const dietController = require("./controllers/dietcontroller");
const {
  validateDietPlan,
  validateDietPlanId,
} = require("./middlewares/dietValidation");

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS
app.use(cors());

// Middleware for parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Routes for diet plans
app.get("/dietplan", dietController.getAllDiets);
app.get("/dietplan/:id", validateDietPlanId, dietController.getDietById);
app.post("/dietplan", validateDietPlan, dietController.createDiet);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
