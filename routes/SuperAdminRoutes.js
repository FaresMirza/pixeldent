const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController")
const CourseController = require("../controllers/CourseController")
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/courses",verifyToken,verifyRole(["super"]),  CourseController.registerCourse)
router.post("/books",verifyToken,verifyRole(["super"]), BookController.registerBook)
router.get("/courses",verifyToken,verifyRole(["super"]), CourseController.getAllCourses)
router.get("/books",verifyToken,verifyRole(["super"]), BookController.getAllBooks); // Get all books
router.get("/courses/:course_id",verifyToken,verifyRole(["super"]), CourseController.getCourseById)
router.get("/books/:book_id",verifyToken,verifyRole(["super"]), BookController.getBookById); // Get a book by ID
router.get("/users/:user_id",verifyToken,verifyRole(["super"]), UserController.getUserById); // Get a user by ID
router.get("/admins/:user_id",verifyToken,verifyRole(["super"]), UserController.getAdminById)
router.put("/approve/:user_id",verifyToken,verifyRole(["super"]), UserController.updateAdminState)
router.put("/userCourseAndBooks/:user_id",verifyToken,verifyRole(["super"]), UserController.updateUserBooksAndCourses)
router.delete("/users/:user_id",verifyToken,verifyRole(["super"]), UserController.updateUserById)


module.exports = router;