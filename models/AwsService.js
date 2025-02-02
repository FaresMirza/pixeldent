const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

// ✅ Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3

});



// ✅ Configure `multer-s3` for direct S3 uploads
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "pixeldentcourses", // ✅ Ensures bucket is correctly set
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, `uploads/${Date.now()}-${file.originalname}`);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE
    })
});

module.exports = {
    upload
};