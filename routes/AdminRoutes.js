const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController")
const CourseController = require("../controllers/CourseController")
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const router = express.Router();

// S3 things

const multer = require("multer");
const storage = multer.memoryStorage(); // Store files in memory before uploading to S3
const upload = multer({ storage });

const uploadFields = [
    { name: "course_image", maxCount: 1 },
    { name: "course_videos", maxCount: 10 },
    { name: "course_lessons", maxCount: 10 },
    { name: "course_files", maxCount: 10 },
];


router.get("/courses", verifyToken,verifyRole(["admin"]),upload.fields(uploadFields), CourseController.getAllCourses)
router.get("/admincourses", verifyToken,verifyRole(["admin"]), CourseController.getAllCoursesForAdmin)
router.post("/courses",verifyToken,verifyRole(["admin"]),  CourseController.registerCourse)
router.get("/books",verifyToken,verifyRole(["admin"]),  BookController.getAllBooks); // Get all books
router.get("/books/:book_id", verifyToken,verifyRole(["admin"]), BookController.getBookById)
router.get("/courses/:course_id",verifyToken,verifyRole(["admin"]),  CourseController.getCourseById)
router.put("/courses/:course_id",verifyToken,verifyRole(["admin"]),  CourseController.updateCourseById)
router.get("/admins/:user_id",verifyToken,verifyRole(["admin"]),  UserController.getAdminById)
router.put("/admins/:user_id",verifyToken,verifyRole(["admin"]),  UserController.updateAdminById)



module.exports = router;