const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

// ✅ إنشاء S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3,
 
});

module.exports = {
    async uploadFileToS3(fileBuffer, fileName, fileMimeType) {
        const key = `uploads/${Date.now()}-${fileName}`;

        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: fileBuffer, // ✅ `multer` يرسل الملفات كـ `buffer` جاهزة
            ContentType: fileMimeType
        }));

        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${key}`;
    }
};