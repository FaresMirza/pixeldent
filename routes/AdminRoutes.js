const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController")
const CourseController = require("../controllers/CourseController")

const router = express.Router();

router.get("/courses", CourseController.getAllCourses)
router.post("/courses", CourseController.registerCourse)
router.get("/books", BookController.getAllBooks); // Get all books
router.get("/courses/:course_id", CourseController.getCourseById)
router.get("/admins/:user_id",UserController.getAdminById)
router.put("/admins/:user_id",UserController.updateAdminById)


module.exports = router;