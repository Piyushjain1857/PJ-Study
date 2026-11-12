import multer from 'multer';
import env from '../../config/env.js';
import { ALLOWED_DOCUMENT_TYPES } from '../../services/storage/storage.service.js';

// Configure memory storage so files are inspected in buffer before saving
const storage = multer.memoryStorage();

const allowedExtensions = new Set(
  Object.values(ALLOWED_DOCUMENT_TYPES).map((t) => t.extension.toLowerCase())
);

/**
 * Filter validating file extensions and MIME types at the HTTP boundary.
 */
function fileFilter(req, file, cb) {
  const ext = file.originalname.slice(((file.originalname.lastIndexOf('.') - 1) >>> 0) + 2);
  const normalizedExt = `.${ext.toLowerCase()}`;

  if (!allowedExtensions.has(normalizedExt)) {
    const error = new Error(
      `File format "${normalizedExt}" is not supported. Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, MD, Images.`
    );
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  return cb(null, true);
}

const maxBytes = env.maxFileSizeMb * 1024 * 1024;

export const noteUpload = multer({
  storage,
  limits: {
    fileSize: maxBytes
  },
  fileFilter
});

/**
 * Middleware handling file upload errors cleanly.
 */
export function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File exceeds maximum allowed size of ${env.maxFileSizeMb}MB.`
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message
      }
    });
  }
  if (err) {
    return next(err);
  }
  return next();
}
