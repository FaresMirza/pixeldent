const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Readable } = require("stream");
require("dotenv").config();

// ✅ تهيئة عميل S3
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3,

});

/**
 * ✅ رفع الملف إلى S3 باستخدام Stream لضمان عدم تلف البيانات
 */
async function uploadFileToS3(fileBuffer, fileName, fileMimeType) {
    if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error("فشل الرفع: الملف فارغ.");
    }

    const key = `uploads/${Date.now()}-${fileName}`;

    // ✅ تحويل الملف إلى Stream لتجنب مشاكل الحجم
    const fileStream = Readable.from(fileBuffer);

    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: fileStream, // ✅ رفع الملف كـ Stream
        ContentType: fileMimeType || "application/octet-stream",
        ContentLength: fileBuffer.length // ✅ تحديد حجم الملف بدقة

    };

    await s3.send(new PutObjectCommand(uploadParams));

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${key}`;
}

module.exports = {
    uploadFileToS3
};