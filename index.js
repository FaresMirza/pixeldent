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

// ✅ Handle EventBridge Events
const handleEventBridge = async (event) => {
    console.log("Received EventBridge event:", JSON.stringify(event, null, 2));

    // Process the event here (if needed)
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "EventBridge Triggered Lambda Successfully!" }),
    };
};

// ✅ Lambda Handler Function (Handles BOTH API & EventBridge)
module.exports.handler = async (event, context) => {
    console.log("Received Event:", JSON.stringify(event, null, 2));

    // 🔹 Check if the request comes from API Gateway (Express.js)
    if (event.requestContext && event.requestContext.apiId) {
        console.log("Handling API Gateway request");
        return serverless(app)(event, context);
    } else {
        console.log("Handling EventBridge event");
        return handleEventBridge(event);
    }
};