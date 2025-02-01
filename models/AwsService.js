const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});


async function uploadFileToS3(fileBuffer, fileName, fileMimeType) {
    try {
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `courses/${Date.now()}-${fileName}`,
            Body: Readable.from(fileBuffer),
            ContentType: fileMimeType
        };

        await s3.send(new PutObjectCommand(uploadParams));

        return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
    } catch (error) {
        throw new Error(`Error uploading file to S3: ${error.message}`);
    }
}

module.exports = { uploadFileToS3 };