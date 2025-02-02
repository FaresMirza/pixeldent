const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("./s3Config"); // Import S3 client

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "pixeldentcourses",
        key: (req, file, cb) => {
            const fileName = `uploads/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE, // ✅ Auto-detect file type
    }),
});

module.exports = upload;