const path = require("path");
const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables first
dotenv.config();

// Import your existing database configuration
const dbConfig = require('./dbconfig');

// Global database pool
let pool = null;

// Database connection function
async function connectToDatabase() {
  try {
    if (!pool) {
      console.log('🔌 Attempting to connect to database...');
      pool = await sql.connect(dbConfig);
      console.log('✅ Database connected successfully');
      
      // Handle connection events
      pool.on('error', (err) => {
        console.error('❌ Database connection error:', err);
        pool = null; // Reset pool on error
      });
    }
    return pool;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    pool = null;
    throw error;
  }
}

// Database health check function
async function checkDatabaseHealth() {
  try {
    if (!pool) {
      await connectToDatabase();
    }
    
    const request = pool.request();
    await request.query('SELECT 1 as test');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    pool = null; // Reset pool on failure
    return false;
  }
}

// Import Swagger setup
const { swaggerUi, swaggerSpec } = require('./swagger-setup');

// Import controllers and middleware
const dietController = require("./controllers/dietcontroller");
const {
  validateDietPlan,
  validateDietPlanId,
} = require("./middleware/dietValidation");

// Import the correct authMiddleware
const authenticateToken = require("./middleware/authMiddleware");

// Import routes
const authRoutes = require('./routes/authRoutes');

// Import settings routes
let settingsRoutes;
try {
  settingsRoutes = require('./routes/settingsRoutes');
  console.log("✅ settingsRoutes loaded successfully");
} catch (error) {
  console.error("❌ Error loading settingsRoutes:", error.message);
}

// Import medication routes
let medicationRoutes;
try {
  medicationRoutes = require('./routes/medicationRoutes');
  console.log("✅ medicationRoutes loaded successfully");
} catch (error) {
  console.error("❌ Error loading medicationRoutes:", error.message);
}

let fitnessRoutes;
try {
  fitnessRoutes = require('./routes/fitnessRoutes');
  console.log("✅ fitnessRoutes loaded successfully");
} catch (error) {
  console.error("❌ Error loading fitnessRoutes:", error.message);
}

// Import appointment routes
let appointmentRoutes;
try {
  appointmentRoutes = require('./routes/appointmentRoutes');
  console.log("✅ appointmentRoutes loaded successfully");
} catch (error) {
  console.error("❌ Error loading appointmentRoutes:", error.message);
  console.error("Full error:", error);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  try {
    if (!pool) {
      await connectToDatabase();
    }
    // Attach pool to request for use in controllers
    req.dbPool = pool;
    next();
  } catch (error) {
    console.error('❌ Database middleware error:', error);
    res.status(503).json({ 
      error: 'Database connection unavailable',
      message: 'Please try again in a moment'
    });
  }
});

// ✅ Enable CORS
app.use(cors());

// ✅ Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// ✅ Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Mokesell Health API Documentation"
}));

// Simple request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ✅ Serve index.html on root - Updated to include API docs link
app.get("/", (req, res) => {
  res.json({
    message: 'Mokesell Health Dashboard API',
    documentation: `http://localhost:${PORT}/api-docs`,
    webApp: `http://localhost:${PORT}/menu.html`,
    endpoints: {
      documentation: '/api-docs',
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      settings: 'GET/PUT /api/settings (auth required)',
      appointments: 'GET /appointments (auth required)',
      medications: 'GET /api/medications (auth required)',
      fitness: 'GET /api/fitness-tracker (auth required)',
      dietplan: 'GET /api/dietplan (auth required)',
      debug: '/debug/routes'
    }
  });
});

// ✅ Auth routes - register & login (do NOT require token)
app.use('/auth', authRoutes);

// ✅ Settings routes (protected) - FIXED ROUTING
if (settingsRoutes) {
  console.log("⚙️ Mounting settings routes at /api/settings");
  app.use('/api/settings', settingsRoutes);
} else {
  console.log("❌ settingsRoutes not available - creating fallback routes");
  
  // Fallback routes for settings
  app.all('/api/settings*', (req, res) => {
    console.error("❌ Settings route accessed but settingsRoutes not loaded");
    res.status(500).json({ 
      error: "Settings routes not loaded properly",
      message: "Check server logs for settingsRoutes loading errors",
      suggestion: "Make sure settingsRoutes.js exists in the routes folder"
    });
  });
}

// ✅ Legacy user routes for backward compatibility
app.use('/api/users', authRoutes);

// Add specific user profile endpoint for backward compatibility
app.get('/api/users/me', authenticateToken, (req, res) => {
  res.json({
    userId: req.user.userId,
    name: req.user.name,
    email: req.user.email,
  });
});

// ✅ Appointment routes (protected) - FIXED ROUTING
if (appointmentRoutes) {
  console.log("📅 Mounting appointment routes at /appointments");
  app.use('/appointments', appointmentRoutes);
  
  // Also mount at /api/appointments for consistency
  app.use('/api/appointments', appointmentRoutes);
} else {
  console.log("❌ appointmentRoutes not available - creating fallback routes");
  
  // Fallback routes for appointments
  app.all('/appointments*', (req, res) => {
    console.error("❌ Appointment route accessed but appointmentRoutes not loaded");
    res.status(500).json({ 
      error: "Appointment routes not loaded properly",
      message: "Check server logs for appointmentRoutes loading errors",
      suggestion: "Make sure appointmentRoutes.js exists in the routes folder"
    });
  });
  
  app.all('/api/appointments*', (req, res) => {
    console.error("❌ API Appointment route accessed but appointmentRoutes not loaded");
    res.status(500).json({ 
      error: "Appointment routes not loaded properly",
      message: "Check server logs for appointmentRoutes loading errors"
    });
  });
}

// ✅ Medication routes (protected)
if (medicationRoutes) {
  console.log("💊 Mounting medication routes at /api");
  app.use('/api', medicationRoutes);
} else {
  console.log("❌ medicationRoutes not available - creating fallback route");
  app.get('/api/medications*', (req, res) => {
    res.status(500).json({ 
      error: "Medication routes not loaded properly",
      message: "Check server logs for medicationRoutes loading errors"
    });
  });
}

// ✅ Fitness tracker routes (protected)
if (fitnessRoutes) {
  console.log("🏃‍♂️ Mounting fitness tracker routes at /api/fitness-tracker");
  app.use('/api/fitness-tracker', fitnessRoutes);
} else {
  console.log("❌ fitnessRoutes not available - creating fallback route");
  app.get('/api/fitness-tracker*', (req, res) => {
    res.status(500).json({ 
      error: "Fitness routes not loaded properly",
      message: "Check server logs for fitnessRoutes loading errors"
    });
  });
}

// ✅ Diet plan routes (protected)
app.get('/api/dietplan', authenticateToken, dietController.getAllDiets);
app.get('/api/dietplan/:id', authenticateToken, validateDietPlanId, dietController.getDietById);
app.post('/api/dietplan', authenticateToken, validateDietPlan, dietController.createDiet);
app.delete('/api/dietplan/:id', authenticateToken, validateDietPlanId, dietController.deleteDiet);
app.put('/api/dietplan/:id', authenticateToken, validateDietPlanId, validateDietPlan, dietController.updateDiet);

// ✅ Legacy dietplan routes (protected) for backward compatibility
app.get('/dietplan', authenticateToken, dietController.getAllDiets);
app.get('/dietplan/:id', authenticateToken, validateDietPlanId, dietController.getDietById);
app.post('/dietplan', authenticateToken, validateDietPlan, dietController.createDiet);
app.delete('/dietplan/:id', authenticateToken, validateDietPlanId, dietController.deleteDiet);
app.put('/dietplan/:id', authenticateToken, validateDietPlanId, validateDietPlan, dietController.updateDiet);

// Debug route to check what routes are mounted
app.get('/debug/routes', (req, res) => {
  const availableRoutes = [
    "POST /auth/login",
    "POST /auth/register",
    "GET /api-docs (Swagger documentation)"
  ];
  
  if (settingsRoutes) {
    availableRoutes.push(
      "GET /api/settings (requires auth)",
      "PUT /api/settings (requires auth)",
      "GET /api/settings/profile (requires auth)",
      "PUT /api/settings/profile (requires auth)",
      "POST /api/settings/change-password (requires auth)",
      "GET /api/settings/export (requires auth)",
      "DELETE /api/settings/delete-account (requires auth)"
    );
  }
  
  if (appointmentRoutes) {
    availableRoutes.push(
      "GET /appointments (requires auth)",
      "POST /appointments (requires auth)", 
      "PUT /appointments/:id (requires auth)",
      "DELETE /appointments/:id (requires auth)",
      "GET /appointments/:id (requires auth)"
    );
  }
  
  if (fitnessRoutes) {
    availableRoutes.push(
      "GET /api/fitness-tracker (requires auth)",
      "GET /api/fitness-tracker/vitals (requires auth)",
      "POST /api/fitness-tracker/vitals (requires auth)"
    );
  }
  
  if (medicationRoutes) {
    availableRoutes.push(
      "GET /api/medications (requires auth)",
      "POST /api/medications (requires auth)",
      "GET /api/medications/today (requires auth)",
      "POST /api/medications/track (requires auth)"
    );
  }
  
  availableRoutes.push(
    "GET /api/dietplan (requires auth)",
    "POST /api/dietplan (requires auth)",
    "PUT /api/dietplan/:id (requires auth)",
    "DELETE /api/dietplan/:id (requires auth)"
  );
  
  res.json({ 
    message: "Server is running",
    swaggerDocs: `http://localhost:${PORT}/api-docs`,
    settingsRoutesLoaded: !!settingsRoutes,
    appointmentRoutesLoaded: !!appointmentRoutes,
    medicationRoutesLoaded: !!medicationRoutes,
    fitnessRoutesLoaded: !!fitnessRoutes,
    availableRoutes
  });
});

// Test route to verify settings work
app.get('/test/settings', authenticateToken, (req, res) => {
  res.json({
    message: "Settings test route working",
    userId: req.user.userId,
    timestamp: new Date().toISOString()
  });
});

// Test route to verify appointments work
app.get('/test/appointments', authenticateToken, (req, res) => {
  res.json({
    message: "Appointment test route working",
    userId: req.user.userId,
    timestamp: new Date().toISOString()
  });
});

// ✅ Health check endpoint with database status
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'Unknown'
  };
  
  try {
    const isHealthy = await checkDatabaseHealth();
    health.database = isHealthy ? 'Connected' : 'Disconnected';
    health.status = isHealthy ? 'OK' : 'Degraded';
  } catch (error) {
    health.database = 'Error';
    health.status = 'Error';
    health.error = error.message;
  }
  
  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Database status endpoint
app.get('/debug/database', async (req, res) => {
  try {
    const isHealthy = await checkDatabaseHealth();
    res.json({
      connected: isHealthy,
      poolExists: !!pool,
      config: {
        server: dbConfig.server,
        database: dbConfig.database,
        user: dbConfig.user,
        // Don't expose password
        connectionTimeout: dbConfig.connectionTimeout,
        requestTimeout: dbConfig.requestTimeout
      }
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message,
      code: error.code
    });
  }
});

// ✅ 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: "Route not found",
    method: req.method,
    url: req.originalUrl,
    suggestion: "Check /debug/routes for available endpoints or visit /api-docs for API documentation"
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Global error handler:", err.stack);
  
  // Handle database connection errors specifically
  if (err.code === 'ECONNCLOSED' || err.code === 'ENOTOPEN') {
    pool = null; // Reset pool on connection error
    return res.status(503).json({
      error: "Database connection error",
      message: "Database temporarily unavailable. Please try again.",
      code: err.code
    });
  }
  
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});

// Initialize database connection before starting server
async function startServer() {
  try {
    // Try to connect to database first
    await connectToDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`📋 Debug routes at: http://localhost:${PORT}/debug/routes`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Database Status: http://localhost:${PORT}/debug/database`);
      
      if (settingsRoutes) {
        console.log(`⚙️ Settings available at: http://localhost:${PORT}/api/settings`);
      } else {
        console.log(`❌ Settings NOT available - check settingsRoutes.js`);
      }
      
      if (appointmentRoutes) {
        console.log(`📅 Appointments available at: http://localhost:${PORT}/appointments`);
      } else {
        console.log(`❌ Appointments NOT available - check appointmentRoutes.js`);
      }
      
      if (fitnessRoutes) {
        console.log(`🏃‍♂️ Fitness tracker available at: http://localhost:${PORT}/api/fitness-tracker`);
      }
      
      if (medicationRoutes) {
        console.log(`💊 Medication tracker available at: http://localhost:${PORT}/api/medications`);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.log('⚠️  Starting server without database connection...');
    
    // Start server anyway, but with degraded functionality
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} (Database offline)`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🗄️  Database Status: http://localhost:${PORT}/debug/database`);
    });
  }
}

// ✅ Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  try {
    if (pool) {
      await pool.close();
      console.log("Database connections closed");
    }
  } catch (error) {
    console.error("Error closing database connections:", error);
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();