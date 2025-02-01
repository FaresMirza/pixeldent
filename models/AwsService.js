const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: "me-south-1"
});


async function uploadFileToS3(fileBuffer, fileName, fileMimeType) {
    try {
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `courses/${Date.now()}-${fileName}`,
            Body: Readable.from(fileBuffer),
            ContentType: fileMimeType
        };

        await s3.send(new PutObjectCommand(uploadParams));

        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${uploadParams.Key}`;
    } catch (error) {
        throw new Error(`Error uploading file to S3: ${error.message}`);
    }
}

module.exports = { uploadFileToS3 };