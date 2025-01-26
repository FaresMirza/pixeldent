const express = require("express");
const UserController = require("../controllers/UserController");

const router = express.Router();

router.post("/postUser", UserController.registerUser); // User registration
router.get("/:user_id", UserController.getUserById); // Get user by ID
router.put("/:user_id", UserController.updateUserById); // Update user by ID
router.get("/users", UserController.getAllUsers)
router.get("/admins", UserController.getAllAdmins)

module.exports = router;