const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");
const path = require("path");

const REGION = process.env.S3_REGION;
const BUCKET = process.env.S3_BUCKET;

const s3 = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
});

// Upload file (used for logs, backups, etc.)
const uploadFile = async (key, filePath) => {
    const fileStream = fs.createReadStream(filePath);

    const uploadParams = {
        Bucket: BUCKET,
        Key: key,
        Body: fileStream,
    };

    await s3.send(new PutObjectCommand(uploadParams));
    console.log(`✅ Uploaded file: ${key}`);
};

// Generate temporary download URL
const getFileUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour link
    return url;
};

// Delete file
const deleteFile = async (key) => {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log(`✅ Deleted file: ${key}`);
};

module.exports = {
    uploadFile,
    getFileUrl,
    deleteFile,
};
