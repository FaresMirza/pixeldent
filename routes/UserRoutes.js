const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController")

const router = express.Router();

router.post("/users", UserController.registerUser); // User registration
router.get("/books", BookController.getAllBooks); // Get all books
router.get("/books/:book_id", BookController.getBookById); // Get a book by ID
router.get("/users/:user_id", UserController.getUserById); // Get a user by ID
router.put("/users/:user_id", UserController.updateUserById); // Update a user by ID



module.exports = router;