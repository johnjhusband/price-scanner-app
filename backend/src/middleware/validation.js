const { body, param, query, validationResult } = require('express-validator');

// Custom validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, error) => {
      if (!acc[error.path]) {
        acc[error.path] = [];
      }
      acc[error.path].push(error.msg);
      return acc;
    }, {});

    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formattedErrors,
    });
  }
  next();
};

// Common validation rules
const commonRules = {
  email: () => 
    body('email')
      .trim()
      .toLowerCase()
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail(),

  password: () =>
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  username: () =>
    body('username')
      .trim()
      .toLowerCase()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  uuid: (field) =>
    param(field)
      .isUUID()
      .withMessage(`Invalid ${field} format`),

  pagination: () => [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a positive integer')
      .toInt(),
  ],

  sortOrder: () =>
    query('order')
      .optional()
      .isIn(['asc', 'desc', 'ASC', 'DESC'])
      .withMessage('Order must be either asc or desc')
      .toLowerCase(),
};

// Validation rules for different endpoints
const validationRules = {
  // Auth validations
  auth: {
    register: [
      commonRules.email(),
      commonRules.username(),
      commonRules.password(),
      body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+$/)
        .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
      handleValidationErrors,
    ],

    login: [
      body('emailOrUsername')
        .trim()
        .notEmpty()
        .withMessage('Email or username is required'),
      body('password')
        .notEmpty()
        .withMessage('Password is required'),
      handleValidationErrors,
    ],

    refreshToken: [
      body('refreshToken')
        .optional()
        .notEmpty()
        .withMessage('Refresh token is required when not using cookies'),
      handleValidationErrors,
    ],

    changePassword: [
      body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
      commonRules.password()
        .custom((value, { req }) => value !== req.body.currentPassword)
        .withMessage('New password must be different from current password'),
      handleValidationErrors,
    ],

    resetPassword: [
      commonRules.password(),
      body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
      handleValidationErrors,
    ],
  },

  // Scan validations
  scan: {
    analyze: [
      body('image')
        .custom((value, { req }) => {
          if (!req.file && !req.body.image) {
            throw new Error('Image is required');
          }
          return true;
        }),
      handleValidationErrors,
    ],

    analyzeBase64: [
      body('image')
        .notEmpty()
        .withMessage('Base64 image data is required')
        .isBase64()
        .withMessage('Invalid base64 image data'),
      body('mimeType')
        .optional()
        .isIn(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
        .withMessage('Invalid image type'),
      handleValidationErrors,
    ],

    update: [
      commonRules.uuid('id'),
      body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters'),
      body('isFavorite')
        .optional()
        .isBoolean()
        .withMessage('isFavorite must be a boolean'),
      handleValidationErrors,
    ],

    search: [
      query('q')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2 })
        .withMessage('Search query must be at least 2 characters'),
      ...commonRules.pagination(),
      handleValidationErrors,
    ],

    list: [
      ...commonRules.pagination(),
      commonRules.sortOrder(),
      query('orderBy')
        .optional()
        .isIn(['scanned_at', 'item_name', 'confidence_score', 'created_at'])
        .withMessage('Invalid orderBy field'),
      query('category')
        .optional()
        .trim()
        .notEmpty(),
      query('favorite')
        .optional()
        .isBoolean()
        .toBoolean(),
      handleValidationErrors,
    ],
  },

  // User validations
  user: {
    updateProfile: [
      body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
      body('profilePictureUrl')
        .optional()
        .isURL()
        .withMessage('Invalid profile picture URL'),
      body('preferences')
        .optional()
        .isObject()
        .withMessage('Preferences must be an object'),
      handleValidationErrors,
    ],

    updateEmail: [
      commonRules.email(),
      body('password')
        .notEmpty()
        .withMessage('Password is required to update email'),
      handleValidationErrors,
    ],
  },

  // Common ID validation
  id: [
    commonRules.uuid('id'),
    handleValidationErrors,
  ],
};

// Sanitization helpers
const sanitizers = {
  // Remove HTML tags and trim
  sanitizeText: (value) => {
    if (!value) return value;
    return value
      .replace(/<[^>]*>/g, '')
      .trim();
  },

  // Sanitize filename
  sanitizeFilename: (filename) => {
    if (!filename) return filename;
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .substring(0, 255);
  },

  // Sanitize search query
  sanitizeSearch: (query) => {
    if (!query) return query;
    return query
      .replace(/[^\w\s-]/g, '')
      .trim()
      .substring(0, 100);
  },
};

module.exports = {
  validationRules,
  handleValidationErrors,
  commonRules,
  sanitizers,
};