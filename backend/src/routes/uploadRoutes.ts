import express from 'express';
import multer from 'multer';
import { uploadFile, uploadMultipleFiles, getPresignedUrl, getFileViewUrl } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Accept images, documents, and common file types
    const allowedMimeTypes = [
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

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// Single file upload
router.post('/single', authenticateToken, upload.single('file'), uploadFile);

// Multiple files upload (up to 5 files)
router.post('/multiple', authenticateToken, upload.array('files', 5), uploadMultipleFiles);

// Get pre-signed URL for direct upload
router.post('/presigned-url', authenticateToken, getPresignedUrl);

// Get pre-signed URL for viewing/downloading a file
router.post('/view-url', authenticateToken, getFileViewUrl);

export default router;
