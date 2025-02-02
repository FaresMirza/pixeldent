const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");

// Initialize S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3,
});

/**
 * Upload file to S3
 */
module.exports = {
    async uploadFileToS3(fileBuffer, fileName, fileMimeType) {
        try {
            const key = `uploads/${Date.now()}-${fileName}`;

            const uploadParams = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                Body: Readable.from(fileBuffer),
                ContentType: fileMimeType,
                ContentLength: fileBuffer.length, // ✅ Fix for "undefined" header issue
                ACL: "public-read"
            };

            await s3.send(new PutObjectCommand(uploadParams));

            return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${key}`;
        } catch (error) {
            console.error("Error uploading file to S3:", error);
            throw new Error(`Error uploading file to S3: ${error.message}`);
        }
    }
};