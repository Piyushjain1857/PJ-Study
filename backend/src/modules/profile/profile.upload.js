import multer from 'multer';

// 5 Megabytes maximum size for avatar images
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

/**
 * Inspects buffer magic bytes to ensure uploaded payload is genuinely a JPEG, PNG, or WebP image.
 *
 * @param {Buffer} buffer
 * @returns {{ valid: boolean, ext?: string, mimeType?: string }}
 */
export function validateAvatarBuffer(buffer) {
  if (!buffer || buffer.length < 8) {
    return { valid: false };
  }

  // JPEG signature: FF D8 (SOI marker)
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { valid: true, ext: '.jpg', mimeType: 'image/jpeg' };
  }

  // PNG signature: 89 50 4E 47 (\x89PNG)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, ext: '.png', mimeType: 'image/png' };
  }

  // WebP signature: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, ext: '.webp', mimeType: 'image/webp' };
  }

  return { valid: false };
}

/**
 * Initial boundary filter checking client-reported mimetype or extension.
 */
function avatarFileFilter(req, file, cb) {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/pjpeg',
    'image/jfif',
    'image/x-png'
  ];
  const originalName = file.originalname || '';
  const ext = originalName.slice(((originalName.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'jfif'];

  const mimeMatch = allowedMimes.includes(file.mimetype?.toLowerCase());
  const extMatch = allowedExts.includes(ext);

  if (!mimeMatch && !extMatch) {
    const error = new Error(
      'Unsupported avatar format. Only JPEG, PNG, and WebP images are permitted.'
    );
    error.statusCode = 400;
    error.code = 'INVALID_AVATAR_TYPE';
    return cb(error, false);
  }
  return cb(null, true);
}

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: MAX_AVATAR_BYTES
  },
  fileFilter: avatarFileFilter
});

/**
 * Middleware handling avatar upload errors gracefully.
 */
export function handleAvatarUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Avatar image exceeds maximum allowed limit of 5MB.'
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

  if (err && err.code === 'INVALID_AVATAR_TYPE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_AVATAR_TYPE',
        message: err.message
      }
    });
  }

  if (err) {
    return next(err);
  }

  return next();
}
