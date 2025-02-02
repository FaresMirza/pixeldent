const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// ✅ إعداد S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,

});

// ✅ رفع الملفات إلى S3
async function uploadFileToS3(fileBuffer, fileName, fileMimeType) {
    const key = `uploads/${uuidv4()}-${fileName}`;
    await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: fileMimeType
    }));
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

module.exports = uploadFileToS3;