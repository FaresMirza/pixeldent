const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// ✅ إعداد S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION_S3,

});

// ✅ رفع الملفات إلى S3
async function generatePresignedUrl(fileName,contentType) {
    const key = `uploads/${uuidv4()}-${fileName}`;

    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
        Expires: 3600 // الصلاحية ساعة واحدة
    };

    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand(params), { expiresIn: 3600 });

    return { uploadUrl, fileUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${key}` };
}

module.exports = generatePresignedUrl;