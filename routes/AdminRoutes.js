const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController")
const CourseController = require("../controllers/CourseController")
const fileUpload = require("express-fileupload");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const router = express.Router();
router.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // ✅ السماح برفع ملفات حتى 10MB
    useTempFiles: false, // ✅ تجنب تخزين الملفات مؤقتًا
    preserveExtension: true, // ✅ الحفاظ على امتداد الملف الأصلي
    abortOnLimit: true
}));


// S3 things



router.post("/upload", CourseController.postToS3Bucket);
router.get("/courses", verifyToken,verifyRole(["admin"]), CourseController.getAllCourses)
router.get("/admincourses", verifyToken,verifyRole(["admin"]), CourseController.getAllCoursesForAdmin)
// router.post("/courses",verifyToken,verifyRole(["admin"]),  CourseController.registerCourse)
router.get("/books",verifyToken,verifyRole(["admin"]),  BookController.getAllBooks); // Get all books
router.get("/books/:book_id", verifyToken,verifyRole(["admin"]), BookController.getBookById)
router.get("/courses/:course_id",verifyToken,verifyRole(["admin"]),  CourseController.getCourseById)
router.put("/courses/:course_id",verifyToken,verifyRole(["admin"]),  CourseController.updateCourseById)
router.get("/admins/:user_id",verifyToken,verifyRole(["admin"]),  UserController.getAdminById)
router.put("/admins/:user_id",verifyToken,verifyRole(["admin"]),  UserController.updateAdminById)



module.exports = router;