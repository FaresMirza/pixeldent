const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController");
const CourseController = require("../controllers/CourseController");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// ❌ Remove fileUpload()
// router.use(fileUpload());
const multer = require("multer");

// ✅ Configure multer middleware
const upload = multer({ storage: multer.memoryStorage() });


// ✅ Enable raw binary data handling
// router.use(express.raw({ type: "*/*", limit: "10mb" }));

// S3 Upload Route
router.post("/courses", upload.any(), CourseController.registerCourse);
router.get("/courses", verifyToken, verifyRole(["admin"]), CourseController.getAllCourses);
router.get("/admincourses", verifyToken, verifyRole(["admin"]), CourseController.getAllCoursesForAdmin);
router.get("/books", verifyToken, verifyRole(["admin"]), BookController.getAllBooks);
router.get("/books/:book_id", verifyToken, verifyRole(["admin"]), BookController.getBookById);
router.get("/courses/:course_id", verifyToken, verifyRole(["admin"]), CourseController.getCourseById);
router.put("/courses/:course_id", verifyToken, verifyRole(["admin"]), CourseController.updateCourseById);
router.get("/admins/:user_id", verifyToken, verifyRole(["admin"]), UserController.getAdminById);
router.put("/admins/:user_id", verifyToken, verifyRole(["admin"]), UserController.updateAdminById);

module.exports = router;