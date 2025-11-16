import fs from 'fs';
import { randomUUID } from 'crypto';
import { awsConfig } from '../config/aws';
import { getPresignedGetUrl, uploadStreamToS3 } from './s3Service';

function sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadImageFromTempFile(params: {
    tempFilePath: string;
    originalFileName: string;
    contentType: string;
    folder?: string;
    makePublic?: boolean;
}): Promise<{
    presignedUrl: string;
}> {
    const bucket = process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET ?? '';
    if (!bucket) {
        throw new Error('S3 bucket is not configured');
    }
    const folder = params.folder ? sanitizeFileName(params.folder) : 'uploads';
    const safeName = sanitizeFileName(params.originalFileName);
    const key = `${folder}/${randomUUID()}-${safeName}`;

    const stat = fs.statSync(params.tempFilePath);
    const body = fs.createReadStream(params.tempFilePath);

    await uploadStreamToS3({
        key,
        contentType: params.contentType,
        body,
        bucket,
        acl: params.makePublic ? 'public-read' : 'private',
    });

    // cleanup temp file (best-effort)
    fs.unlink(params.tempFilePath, () => { });

    const region = awsConfig.awsRegion ?? 'ap-southeast-2';
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    const presignedUrl = await getPresignedGetUrl({ bucket, key, expiresInSeconds: 3600 });

    return {
        presignedUrl,
    };

}

export default { uploadImageFromTempFile };


