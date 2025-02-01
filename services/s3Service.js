const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const s3 = new S3Client({ region: "me-south-1" });

const BUCKET_NAME = "pixeldentcourses"; // Change this

// Configure Multer to handle file uploads
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        key: function (req, file, cb) {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${Date.now()}-${file.originalname}`;
            cb(null, `uploads/${fileName}`);
        }
    })
});

// Function to manually upload files
async function uploadFileToS3(fileBuffer, fileName) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: "video/mp4", // Adjust for images (image/jpeg, image/png)
        ACL: "public-read",
    };

    try {
        await s3.send(new PutObjectCommand(params));
        return `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw new Error("Failed to upload file to S3");
    }
}

module.exports = { upload, uploadFileToS3 };