const express = require("express");
const UserController = require("../controllers/UserController");
const BookController = require("../controllers/BookController");
const CourseController = require("../controllers/CourseController");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");
const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

const router = express.Router();

// ❌ Remove fileUpload()
// router.use(fileUpload());
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = new S3Client({ region: process.env.AWS_REGION_S3 });

// ✅ Configure multer middleware


// ✅ Enable raw binary data handling
// router.use(express.raw({ type: "*/*", limit: "10mb" }));

// S3 Upload Route

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "pixeldentcourses",
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `uploads/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE, // ✅ يضبط النوع تلقائيًا
    }),
});

// ✅ ضبط الحقول للرفع
router.post(
    "/courses",
    upload.fields([
        { name: "course_image", maxCount: 1 },
        { name: "course_videos", maxCount: 5 },
        { name: "course_lessons", maxCount: 10 },
        { name: "course_files", maxCount: 10 }
    ]),
    CourseController.registerCourse
);


router.get("/courses", verifyToken, verifyRole(["admin"]), CourseController.getAllCourses);
router.get("/admincourses", verifyToken, verifyRole(["admin"]), CourseController.getAllCoursesForAdmin);
router.get("/books", verifyToken, verifyRole(["admin"]), BookController.getAllBooks);
router.get("/books/:book_id", verifyToken, verifyRole(["admin"]), BookController.getBookById);
router.get("/courses/:course_id", verifyToken, verifyRole(["admin"]), CourseController.getCourseById);
router.put("/courses/:course_id", verifyToken, verifyRole(["admin"]), CourseController.updateCourseById);
router.get("/admins/:user_id", verifyToken, verifyRole(["admin"]), UserController.getAdminById);
router.put("/admins/:user_id", verifyToken, verifyRole(["admin"]), UserController.updateAdminById);

module.exports = router;