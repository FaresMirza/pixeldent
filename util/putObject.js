const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("./s3-credentials");
const mime = require("mime-types"); // ✅ Import mime-types to detect correct Content-Type

exports.putObject = async (file, fileName) => {
    try {
        // ✅ Ensure correct MIME type
        const contentType = mime.lookup(fileName) || "application/octet-stream";

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: file,
            ContentType: contentType, // ✅ Auto-detect correct type
        };

        const command = new PutObjectCommand(params);
        const data = await s3Client.send(command);

        if (data.$metadata.httpStatusCode !== 200) {
            throw new Error("S3 upload failed with status code: " + data.$metadata.httpStatusCode);
        }

        let url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION_S3}.amazonaws.com/${params.Key}`;
        return { url, key: params.Key, contentType };
    } catch (err) {
        console.error("Error uploading to S3:", err);
        throw new Error("Error uploading file to S3: " + err.message);
    }
};