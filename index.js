const express = require("express");
const serverless = require("serverless-http");
const fileUpload = require("express-fileupload");

// Import Routes
const UserRoutes = require("./routes/UserRoutes");
const SuperAdminRoutes = require("./routes/SuperAdminRoutes");
const AdminRoutes = require("./routes/AdminRoutes");
const AuthRoutes = require("./routes/AuthRoutes");

// Initialize Express App
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File Upload Middleware (Supports up to 50MB)
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));

// ✅ Logging Middleware
app.use((req, res, next) => {
    console.log(`API Request: ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body).length) {
        console.log("Body:", JSON.stringify(req.body, null, 2));
    }
    if (Object.keys(req.query).length) {
        console.log("Query Params:", JSON.stringify(req.query, null, 2));
    }
    next();
});

// Define Routes
app.use("/pixeldent/user", UserRoutes);
app.use("/pixeldent/superadmin", SuperAdminRoutes);
app.use("/pixeldent/admin", AdminRoutes);
app.use("/pixeldent/auth", AuthRoutes);

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Express Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Export Lambda Handler (Handles ONLY API Gateway Requests)
module.exports.handler = serverless(app);