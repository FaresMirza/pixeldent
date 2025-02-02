const express = require("express");
const serverless = require("serverless-http");
const UserRoutes = require("./routes/UserRoutes"); // Import user routes
const SuperAdminRoutes = require("./routes/SuperAdminRoutes")
const AdminRoutes = require("./routes/AdminRoutes")
const AuthRoutes = require("./routes/AuthRoutes")
const fileUpload = require("express-fileupload");


const app = express();
app.use(express.json()); // Parse JSON bodies
app.use(fileUpload()); // ✅ تمكين رفع الملفات
app.use(express.urlencoded({ extended: true }));

// Define routes
app.use("/pixeldent/user", UserRoutes); // Prefix for user routes
app.use("/pixeldent/superadmin", SuperAdminRoutes)
app.use("/pixeldent/admin", AdminRoutes)
app.use("/pixeldent/auth", AuthRoutes)

module.exports.handler = serverless(app);
