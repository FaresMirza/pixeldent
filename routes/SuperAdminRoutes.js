const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController")
const CourseController = require("../controllers/CourseController")
const router = express.Router();

router.post("/courses", CourseController.registerCourse)
router.post("/books", BookController.registerBook)
router.get("/courses", CourseController.getAllCourses)
router.get("/books", BookController.getAllBooks); // Get all books
router.get("/courses/:course_id", CourseController.getCourseById)
router.get("/books/:book_id", BookController.getBookById); // Get a book by ID
router.get("/users/:user_id", UserController.getUserById); // Get a user by ID
router.get("/admins/:user_id",UserController.getAdminById)
router.put("/admins/:user_id",UserController.updateAdminById)
router.put("/userCourseAndBooks/:user_id",UserController.updateUserBooksAndCourses)
router.delete("/users/:user_id",UserController.updateUserById)




module.exports = router;