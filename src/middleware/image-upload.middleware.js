const multer = require('multer');
const { securityEvent } = require('../services/security-events.service');

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
]);

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.IMAGE_MAX_SIZE_BYTES || 12 * 1024 * 1024),
    files: 1,
    fields: 10,
  },
  fileFilter(req, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      const error = new Error('El archivo debe ser una imagen JPG, PNG, WebP, GIF, AVIF o HEIC');
      error.code = 'INVALID_IMAGE_TYPE';
      return callback(error);
    }
    return callback(null, true);
  },
});

function singleImage(req, res, next) {
  uploader.single('imagen')(req, res, (error) => {
    if (!error) return next();
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    securityEvent(req, 'image_upload_rejected', { reason: error.code });
    return res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'IMAGE_TOO_LARGE' : (error.code || 'INVALID_IMAGE'),
        message: tooLarge ? 'La imagen supera el tamaño máximo permitido de 12 MB' : error.message,
      },
    });
  });
}

module.exports = { singleImage };
