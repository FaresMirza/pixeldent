const express = require("express");
const UserController = require("../controllers/UserController");

const router = express.Router();

router.post("/postUser", UserController.registerUser); // User registration
router.get("/:user_id", UserController.getUserById); // Get user by ID
router.put("/:user_id", UserController.updateUserById); // Update user by ID
router.get("/getAllUsers", UserController.getAllUsers)
router.get("/getAllAdmins", UserController.getAllAdmins)

module.exports = router;