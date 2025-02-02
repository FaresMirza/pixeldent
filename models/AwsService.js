const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// ✅ إنشاء S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3,

});

/**
 * ✅ رفع الملف إلى S3 بدون تخريبه
 */
async function uploadFileToS3(fileBuffer, fileName, fileMimeType) {
    const key = `uploads/${Date.now()}-${fileName}`;

    await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: Buffer.from(fileBuffer), // ✅ تأكد من إرسال البيانات بدون تعديل
        ContentType: fileMimeType
    }));

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${key}`;
}

module.exports = { uploadFileToS3 };