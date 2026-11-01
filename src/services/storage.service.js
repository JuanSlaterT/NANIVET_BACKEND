const path = require('path');
const { randomUUID } = require('crypto');
const {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const DEFAULT_ENDPOINT = 'https://ngiyktpklmbktgonvhgj.storage.supabase.co/storage/v1/s3';
const DEFAULT_REGION = 'us-west-2';
const DEFAULT_BUCKET = 'nanivet';
const STORED_PREFIX = 's3:';

let storageClient;
let bucketReadyPromise;

function storageConfig() {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    const error = new Error('El almacenamiento de imágenes no está configurado');
    error.code = 'STORAGE_NOT_CONFIGURED';
    error.statusCode = 503;
    throw error;
  }

  return {
    endpoint: process.env.S3_ENDPOINT || DEFAULT_ENDPOINT,
    region: process.env.S3_REGION || DEFAULT_REGION,
    bucket: process.env.S3_BUCKET || DEFAULT_BUCKET,
    accessKeyId,
    secretAccessKey,
  };
}

function client() {
  if (storageClient) return storageClient;
  const config = storageConfig();
  storageClient = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return storageClient;
}

async function ensureBucket(config) {
  if (!bucketReadyPromise) {
    bucketReadyPromise = (async () => {
      try {
        await client().send(new HeadBucketCommand({ Bucket: config.bucket }));
      } catch (error) {
        const status = error?.$metadata?.httpStatusCode;
        if (status !== 404 && error?.name !== 'NotFound' && error?.name !== 'NoSuchBucket') throw error;
        await client().send(new CreateBucketCommand({ Bucket: config.bucket }));
      }
    })().catch(error => {
      bucketReadyPromise = null;
      throw error;
    });
  }
  return bucketReadyPromise;
}

function extensionFor(file) {
  const byMime = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
    'image/heic': '.heic',
    'image/heif': '.heif',
  };
  return byMime[file.mimetype] || path.extname(file.originalname || '').toLowerCase() || '.img';
}

async function uploadImage(file, folder) {
  const config = storageConfig();
  await ensureBucket(config);
  const key = `${folder}/${randomUUID()}${extensionFor(file)}`;
  await client().send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'private, max-age=3600',
  }));
  return { key, storedValue: `${STORED_PREFIX}${key}` };
}

function storedKey(value) {
  return typeof value === 'string' && value.startsWith(STORED_PREFIX)
    ? value.slice(STORED_PREFIX.length)
    : null;
}

async function resolveStoredMediaUrl(value) {
  const key = storedKey(value);
  if (!key) return value || null;
  const config = storageConfig();
  return getSignedUrl(client(), new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  }), { expiresIn: Number(process.env.S3_SIGNED_URL_TTL_SECONDS || 3600) });
}

async function deleteStoredMedia(value) {
  const key = storedKey(value);
  if (!key) return;
  const config = storageConfig();
  await client().send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

module.exports = {
  uploadImage,
  resolveStoredMediaUrl,
  deleteStoredMedia,
};
