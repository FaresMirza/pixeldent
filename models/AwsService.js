const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");

// Initialize S3 Client with credentials and region
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3, // Ensure this is correctly set in your .env file
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Uploads a file to AWS S3.
 *
 * @param {Buffer} fileBuffer - The file content as a buffer.
 * @param {string} fileName - The name of the file.
 * @param {string} fileMimeType - The MIME type of the file.
 * @returns {string} - The S3 file URL.
 */
async function uploadFileToS3(fileBuffer, fileName, fileMimeType) {
    try {
        if (!fileBuffer || !fileName || !fileMimeType) {
            throw new Error("Invalid parameters: fileBuffer, fileName, and fileMimeType are required.");
        }

        // Ensure AWS_S3_BUCKET is set
        if (!process.env.AWS_S3_BUCKET) {
            throw new Error("Missing AWS_S3_BUCKET environment variable.");
        }

        const key = `courses/${Date.now()}-${fileName}`;

        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: Readable.from(fileBuffer),
            ContentType: fileMimeType
        };

        // Upload file to S3
        const result = await s3.send(new PutObjectCommand(uploadParams));

        console.log("File uploaded successfully:", result);

        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${key}`;
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new Error(`Error uploading file to S3: ${error.message}`);
    }
}

module.exports = { uploadFileToS3 };