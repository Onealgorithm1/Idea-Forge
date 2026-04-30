import { Request, Response } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import path from 'path';

// Configure S3 client for Backblaze B2
const s3Client = new S3Client({
  endpoint: `https://${env.B2_ENDPOINT}`,
  region: env.B2_REGION || 'eu-central-003',
  credentials: {
    accessKeyId: env.B2_KEY_ID || '',
    secretAccessKey: env.B2_APPLICATION_KEY || '',
  },
});

const BUCKET_NAME = env.B2_BUCKET_NAME || '';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export async function uploadFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Validate file size (10MB limit)
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(413).json({ 
        message: `File size exceeds 10MB limit. Current size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB` 
      });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(415).json({ 
        message: 'File type not allowed. Allowed types: images (JPEG, PNG, GIF, WebP), PDF, Word, Excel, and text files.' 
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(req.file.originalname);
    const safeFilename = `${timestamp}-${randomString}${extension}`;
    const key = `attachments/${safeFilename}`;

    // Upload to B2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        'original-name': req.file.originalname,
        'uploaded-by': (req as any).user?.id || 'anonymous',
      },
    });

    await s3Client.send(command);

    // Store the B2 friendly URL in database (for long-term storage reference)
    const b2Host = env.B2_ENDPOINT?.replace('s3.', 'f000.') || 'f000.backblazeb2.com';
    const storedUrl = `https://${b2Host}/file/${BUCKET_NAME}/${key}`;
    
    // Generate pre-signed URL for immediate viewing (valid for 1 hour)
    const viewCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const viewUrl = await getSignedUrl(s3Client, viewCommand, { expiresIn: 3600 });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        url: viewUrl,        // Pre-signed URL for immediate preview
        storedUrl: storedUrl, // Friendly URL to store in database
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        key: key,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function uploadMultipleFiles(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return res.status(413).json({ 
          message: `File "${file.originalname}" exceeds 10MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
        });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(415).json({ 
          message: `File type not allowed for "${file.originalname}". Allowed types: images, PDF, Word, Excel, and text files.` 
        });
      }
    }

    const uploadResults = [];

    for (const file of files) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(file.originalname);
      const safeFilename = `${timestamp}-${randomString}${extension}`;
      const key = `attachments/${safeFilename}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          'original-name': file.originalname,
          'uploaded-by': (req as any).user?.id || 'anonymous',
        },
      });

      await s3Client.send(command);

      // Construct public URL using B2 friendly URL format
      const b2Host = env.B2_ENDPOINT?.replace('s3.', 'f000.') || 'f000.backblazeb2.com';
      const fileUrl = `https://${b2Host}/file/${BUCKET_NAME}/${key}`;

      uploadResults.push({
        url: fileUrl,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        key: key,
      });
    }

    res.status(201).json({
      message: `${uploadResults.length} file(s) uploaded successfully`,
      files: uploadResults,
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(501).json({ message: 'Not implemented' });
  }
}

/**
 * Generates a pre-signed URL for direct frontend uploads to B2.
 */
export async function getPresignedUrl(req: Request, res: Response) {
  try {
    const { fileName, fileType, fileSize } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'fileName and fileType are required' });
    }

    // Validate file size (10MB limit) if provided
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return res.status(413).json({ 
        message: `File size exceeds 10MB limit.` 
      });
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 11);
    const extension = path.extname(fileName);
    const safeFilename = `${timestamp}-${randomString}${extension}`;
    const key = `attachments/${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        'original-name': fileName,
        'uploaded-by': (req as any).user?.id || 'anonymous',
      },
    });

    // Generate pre-signed URL (valid for 15 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // Construct public view URL using B2 friendly URL format
    const b2Host = env.B2_ENDPOINT?.replace('s3.', 'f000.') || 'f000.backblazeb2.com';
    const fileUrl = `https://${b2Host}/file/${BUCKET_NAME}/${key}`;

    res.status(200).json({
      uploadUrl,
      fileUrl,
      key,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ 
      message: 'Failed to generate upload URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Upload a buffer directly to Backblaze B2.
 */
export async function uploadBufferToB2(buffer: Buffer, mimetype: string, originalname: string, folder: string = 'attachments'): Promise<{ url: string, key: string }> {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalname);
  const safeFilename = `${timestamp}-${randomString}${extension}`;
  const key = `${folder}/${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    Metadata: {
      'original-name': encodeURIComponent(originalname),
    },
  });

  await s3Client.send(command);

  const b2Host = env.B2_ENDPOINT?.replace('s3.', 'f000.') || 'f000.backblazeb2.com';
  const fileUrl = `https://${b2Host}/file/${BUCKET_NAME}/${key}`;

  return { url: fileUrl, key };
}

/**
 * Delete a file from Backblaze B2 bucket.
 * Extracts the key from the full B2 URL.
 */
export async function deleteFileFromB2(fileUrl: string): Promise<boolean> {
  try {
    // Extract key from URL - supports both formats:
    // Old S3-style: https://s3.eu-central-003.backblazeb2.com/bucket/attachments/filename
    // Friendly: https://f000.backblazeb2.com/file/bucket/attachments/filename
    let key: string | null = null;
    
    // Try friendly URL format first: /file/BUCKET/KEY
    const friendlyPattern = new RegExp(`/file/${BUCKET_NAME}/(.+)$`);
    const friendlyMatch = fileUrl.match(friendlyPattern);
    if (friendlyMatch) {
      key = friendlyMatch[1];
    } else {
      // Try S3-style format: /BUCKET/KEY
      const s3Pattern = new RegExp(`${BUCKET_NAME}/(.+)$`);
      const s3Match = fileUrl.match(s3Pattern);
      if (s3Match) {
        key = s3Match[1];
      }
    }
    
    if (!key) {
      console.error('Could not extract key from URL:', fileUrl);
      return false;
    }
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Deleted file from B2: ${key}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from B2:', error);
    return false;
  }
}

/**
 * Generate a pre-signed URL for viewing/downloading a file.
 * This works even with private buckets.
 * URL is valid for 1 hour.
 */
export async function generateViewUrl(fileUrl: string): Promise<string | null> {
  if (!fileUrl) return null;
  
  try {
    let key: string | null = null;
    
    if (fileUrl.startsWith('http')) {
      // Strip query parameters
      const urlWithoutParams = fileUrl.split('?')[0];
      
      // Try friendly URL format first: /file/BUCKET/KEY
      const friendlyPattern = new RegExp(`/file/${BUCKET_NAME}/(.+)$`);
      const friendlyMatch = urlWithoutParams.match(friendlyPattern);
      
      if (friendlyMatch) {
        key = friendlyMatch[1];
      } else {
        // Try S3-style format: endpoint/BUCKET/KEY
        const s3Pattern = new RegExp(`${BUCKET_NAME}/(.+)$`);
        const s3Match = urlWithoutParams.match(s3Pattern);
        if (s3Match) {
          key = s3Match[1];
        }
      }
    } else {
      // It's already a key (e.g. "avatars/filename.png")
      key = fileUrl;
    }
    
    if (!key) {
      // If it's a full URL but not from B2, return as is
      if (fileUrl.startsWith('http')) return fileUrl;
      return null;
    }
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // Generate pre-signed URL valid for 1 hour
    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return viewUrl;
  } catch (error) {
    console.error('Error generating view URL:', error);
    return fileUrl.startsWith('http') ? fileUrl : null;
  }
}

/**
 * Express handler to get a pre-signed view URL for a file
 */
export async function getFileViewUrl(req: Request, res: Response) {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ message: 'fileUrl is required' });
    }

    const viewUrl = await generateViewUrl(fileUrl);
    
    if (!viewUrl) {
      return res.status(400).json({ message: 'Invalid file URL' });
    }

    res.json({ viewUrl });
  } catch (error) {
    console.error('Get file view URL error:', error);
    res.status(500).json({ message: 'Failed to generate view URL' });
  }
}
