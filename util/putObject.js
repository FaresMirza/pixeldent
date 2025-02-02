const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("./s3-credentials");
const mime = require("mime-types");

exports.putObject = async (file, fileName, fileMimeType) => {
    try {
        if (!file || file.length === 0) {
            throw new Error("Uploaded file is empty");
        }

        const contentType = fileMimeType || mime.lookup(fileName) || "application/octet-stream";

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: file, // ✅ Send binary data directly
            ContentType: contentType, // ✅ Set correct MIME type
            ContentLength: file.length, // ✅ Ensure correct file size
            ContentEncoding: 'base64'
        };

        const command = new PutObjectCommand(params);
        const data = await s3Client.send(command);

        if (data.$metadata.httpStatusCode !== 200) {
            throw new Error("S3 upload failed with status code: " + data.$metadata.httpStatusCode);
        }

        let url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${params.Key}`;
        return { url, key: params.Key, contentType };
    } catch (err) {
        console.error("❌ Error uploading to S3:", err);
        throw new Error("Error uploading file to S3: " + err.message);
    }
};