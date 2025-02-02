const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");
require("dotenv").config();

// ✅ إنشاء S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3
});

module.exports = {
    async uploadFileToS3(fileBuffer, fileName, fileMimeType) {
        if (!fileBuffer || fileBuffer.length === 0) {
            throw new Error("⚠️ فشل الرفع: الملف فارغ.");
        }

        const key = `uploads/${Date.now()}-${fileName}`;

        // ✅ رفع الملف كـ `stream` للحفاظ على البيانات الأصلية
        const fileStream = Readable.from(fileBuffer);

        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: fileStream, // ✅ استخدام Stream بدلاً من Buffer
            ContentType: fileMimeType
        }));

        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${key}`;
    }
};