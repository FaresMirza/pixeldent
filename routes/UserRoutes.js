const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController")
const CourseController = require("../controllers/CourseController")
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");


const router = express.Router();

router.get("/courses", CourseController.getAllCourses)
router.get("/books", BookController.getAllBooks); // Get all books
router.get("/admins",UserController.getAllAdmins)
router.get("/usercourses", verifyToken,verifyRole(["normal"]), CourseController.getAllCoursesForUser)
router.get("/courses/:course_id",verifyToken,verifyRole(["normal"]), CourseController.getCourseById)
router.get("/books/:book_id",verifyToken,verifyRole(["normal"]), BookController.getBookById); // Get a book by ID
router.get("/users/:user_id",verifyToken,verifyRole(["normal"]), UserController.getUserById); // Get a user by ID
router.put("/users/:user_id",verifyToken,verifyRole(["normal"]), UserController.updateUserById)



module.exports = router;