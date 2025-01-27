const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController")
const CourseController = require("../controllers/CourseController")

const router = express.Router();

router.post("/users", UserController.registerUser); // User registration
router.post("/courses", CourseController.registerCourse)
router.post("/admins",UserController.registerAdmin)
router.get("/courses", CourseController.getAllCourses)
router.get("/books", BookController.getAllBooks); // Get all books
router.get("/courses/:course_id", CourseController.getCourseById)
router.get("/books/:book_id", BookController.getBookById); // Get a book by ID
router.get("/users/:user_id", UserController.getUserById); // Get a user by ID
router.put("/users/:user_id", UserController.updateUserById); // Update a user by ID
router.put("/admins/:user_id",UserController.updateAdminById)



module.exports = router;