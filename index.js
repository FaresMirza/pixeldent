const express = require("express");
const serverless = require("serverless-http");
const UserRoutes = require("./routes/UserRoutes");
const SuperAdminRoutes = require("./routes/SuperAdminRoutes");
const AdminRoutes = require("./routes/AdminRoutes");
const AuthRoutes = require("./routes/AuthRoutes");
const fileUpload = require("express-fileupload");

const app = express();
app.use(express.json()); // Parse JSON bodies

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // يسمح برفع ملفات تصل إلى 50MB
}));

app.use(express.urlencoded({ extended: true }));

// ✅ Logging Middleware: Logs every API call to CloudWatch
app.use((req, res, next) => {
    console.log(`API Request: ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body).length) {
        console.log("Body:", JSON.stringify(req.body, null, 2));
    }
    if (Object.keys(req.query).length) {
        console.log("Query Params:", JSON.stringify(req.query, null, 2));
    }
    next(); // Move to the next middleware or route
});

// Define routes
app.use("/pixeldent/user", UserRoutes);
app.use("/pixeldent/superadmin", SuperAdminRoutes);
app.use("/pixeldent/admin", AdminRoutes);
app.use("/pixeldent/auth", AuthRoutes);

module.exports.handler = serverless(app);