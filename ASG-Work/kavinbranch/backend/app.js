const path = require("path");
const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Import controllers and middleware
const dietController = require("./controllers/dietcontroller");
const {
  validateDietPlan,
  validateDietPlanId,
} = require("./middlewares/dietValidation");

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS
app.use(cors());

// ✅ Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files (like index.html, script.js) from "public"
app.use(express.static(path.join(__dirname, "public")));

// ✅ Serve index.html on the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ API routes
app.get('/dietplan', dietController.getAllDiets);
app.get('/dietplan/:id', validateDietPlanId, dietController.getDietById);
app.post("/dietplan", validateDietPlan, dietController.createDiet);
app.delete('/dietplan/:id', validateDietPlanId, dietController.deleteDiet);




// ✅ Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// ✅ Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  await sql.close();
  console.log("Database connections closed");
  process.exit(0);
});
