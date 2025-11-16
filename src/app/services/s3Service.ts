import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig } from '../config/aws';
import type { Readable } from 'stream';

type PresignParams = {
  bucket?: string;
  key: string;
  contentType: string;
  expiresInSeconds?: number;
};

const s3Client = new S3Client({
  region: awsConfig.awsRegion,
  credentials: awsConfig.awsAccessKey && awsConfig.awsSecretKey
    ? {
      accessKeyId: awsConfig.awsAccessKey,
      secretAccessKey: awsConfig.awsSecretKey,
    }
    : undefined,
});

export async function getPresignedPutUrl({
  bucket,
  key,
  contentType,
  expiresInSeconds = 900, // 15 minutes
}: PresignParams): Promise<string> {
  const Bucket = bucket ?? process.env.AWS_S3_BUCKET ?? '';
  if (!Bucket) {
    throw new Error('S3 bucket is not configured');
  }
  const command = new PutObjectCommand({
    Bucket,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read',
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function getPresignedGetUrl(params: {
  bucket?: string;
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const Bucket = params.bucket ?? process.env.AWS_S3_BUCKET ?? '';
  if (!Bucket) {
    throw new Error('S3 bucket is not configured');
  }
  const command = new GetObjectCommand({
    Bucket,
    Key: params.key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds ?? 3600 });
}

export async function uploadStreamToS3(params: {
  bucket?: string;
  key: string;
  contentType: string;
  body: Readable;
  acl?: 'private' | 'public-read';
}): Promise<void> {
  const Bucket = params.bucket ?? process.env.AWS_S3_BUCKET ?? '';
  if (!Bucket) {
    throw new Error('S3 bucket is not configured');
  }
  const command = new PutObjectCommand({
    Bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    ACL: params.acl,
  });
  await s3Client.send(command);
}

export default { getPresignedPutUrl };


