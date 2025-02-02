const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

// ✅ Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3,
  
});

/**
 * ✅ Configure `multer-s3` for direct S3 uploads
 */
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "pixeldentcourses",
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, `uploads/${Date.now()}-${file.originalname}`);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE, // ✅ Detects file type automatically
    })
});

/**
 * ✅ Upload file to S3 using `PutObjectCommand`
 */
async function uploadFileToS3(fileBuffer, fileName, fileMimeType) {
    try {
        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error("File buffer is empty. Upload failed.");
        }

        const key = `uploads/${Date.now()}-${fileName}`;

        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: fileBuffer,
            ContentType: fileMimeType,
            ContentLength: fileBuffer.length
        };

        console.log("✅ Uploading file:", fileName);
        console.log("✅ File Size (bytes):", fileBuffer.length);
        console.log("✅ MIME Type:", fileMimeType);

        await s3.send(new PutObjectCommand(uploadParams));

        console.log("✅ File uploaded successfully:", key);

        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${key}`;
    } catch (error) {
        console.error("❌ Error uploading file to S3:", error);
        throw new Error(`Error uploading file to S3: ${error.message}`);
    }
}

// ✅ Export both methods for usage in controllers
module.exports = {
    upload,
    uploadFileToS3
};