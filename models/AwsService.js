const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config(); // ✅ Load environment variables

// ✅ Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * ✅ Upload file to S3 using buffer
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

module.exports = {
    uploadFileToS3
};