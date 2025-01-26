const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController")

const router = express.Router();

router.post("/postUser", UserController.registerUser); // User registration
router.get("/:user_id", UserController.getUserById); // Get user by ID
router.put("/:user_id", UserController.updateUserById); // Update user by ID
router.get("/books", BookController.getAllBooks)


module.exports = router;