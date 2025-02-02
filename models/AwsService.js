const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

// ✅ Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3,

});

/**
 * ✅ Upload file to S3 using raw buffer
 */
async function uploadFileToS3(fileBuffer, fileName, fileMimeType) {
    if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error("File buffer is empty. Upload failed.");
    }

    const key = `uploads/${Date.now()}-${fileName}`;

    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: Buffer.from(fileBuffer), // ✅ Ensure correct binary format
        ContentType: fileMimeType || "application/octet-stream",
        ContentLength: fileBuffer.length
    };

    await s3.send(new PutObjectCommand(uploadParams));

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${key}`;
}

module.exports = {
    uploadFileToS3
};