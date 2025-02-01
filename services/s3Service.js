const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require("@aws-sdk/client-s3");

// Initialize S3 Client
const s3Client = new S3Client({
    region: "me-south-1", // Replace with your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Function to upload a file
const uploadFileToS3 = async (bucketName, fileName, fileBuffer, fileType) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: fileType, // MIME type (e.g., "image/jpeg", "video/mp4")
        ACL: "public-read", // Optional: Set the object to be publicly accessible
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(params));
        console.log("File uploaded successfully!", data);
        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

// Function to get a file URL
const getFileUrl = (bucketName, fileName) => {
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

// Function to list all files in a bucket
const listFilesInS3 = async (bucketName) => {
    const params = { Bucket: bucketName };

    try {
        const data = await s3Client.send(new ListObjectsV2Command(params));
        return data.Contents.map(file => file.Key);
    } catch (error) {
        console.error("Error listing files:", error);
        throw error;
    }
};

// Function to delete a file from S3
const deleteFileFromS3 = async (bucketName, fileName) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
    };

    try {
        await s3Client.send(new DeleteObjectCommand(params));
        console.log("File deleted successfully!");
    } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
    }
};

module.exports = {
    s3Client,
    uploadFileToS3,
    getFileUrl,
    listFilesInS3,
    deleteFileFromS3,
};