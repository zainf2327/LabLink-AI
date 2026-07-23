import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
const isMock = !env.AWS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID.startsWith('mock');
const s3Client = isMock ? null : new S3Client({
    region: env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
});
export const s3Service = {
    async uploadFile(fileBuffer, fileKey, mimeType) {
        if (isMock) {
            console.log(`[S3 MOCK] Uploading file to key: ${fileKey}`);
            return `https://${env.AWS_S3_BUCKET_NAME || 'lablink-reports-bucket'}.s3.${env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;
        }
        const command = new PutObjectCommand({
            Bucket: env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: mimeType,
        });
        await s3Client.send(command);
        return `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;
    },
    async deleteFile(fileKey) {
        if (isMock) {
            console.log(`[S3 MOCK] Deleting file key: ${fileKey}`);
            return;
        }
        const command = new DeleteObjectCommand({
            Bucket: env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
        });
        await s3Client.send(command);
    },
    async getPresignedDownloadUrl(fileKey) {
        if (isMock) {
            console.log(`[S3 MOCK] Generating pre-signed URL for key: ${fileKey}`);
            return `https://${env.AWS_S3_BUCKET_NAME || 'lablink-reports-bucket'}.s3.${env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}?mock-signature=true`;
        }
        const command = new GetObjectCommand({
            Bucket: env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
        });
        // Expire in 15 minutes (900 seconds)
        return await getSignedUrl(s3Client, command, { expiresIn: 900 });
    },
    async getFileStream(fileKey) {
        if (isMock) {
            console.log(`[S3 MOCK] File streaming requested for key: ${fileKey}; no local mock PDF is configured.`);
            return null;
        }
        const command = new GetObjectCommand({
            Bucket: env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
        });
        const response = await s3Client.send(command);
        return {
            stream: response.Body,
            mimeType: response.ContentType,
            contentLength: response.ContentLength,
        };
    }
};
