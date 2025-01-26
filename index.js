const express = require("express");
const serverless = require("serverless-http");
const UserRoutes = require("./routes/UserRoutes"); // Import user routes

const app = express();
app.use(express.json()); // Parse JSON bodies

// Define routes
app.use("/pixeldent/user/", UserRoutes); // Prefix for user routes

module.exports.handler = serverless(app);
