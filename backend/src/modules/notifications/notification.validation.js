import { VALID_CATEGORIES } from './notification.service.js';
import { VALID_AUDIENCES, VALID_PRIORITIES } from './announcement.service.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates request parameters for notification queries.
 */
export function validateNotificationQuery(req, res, next) {
  const { page, limit, status, category } = req.query;

  if (page !== undefined) {
    const parsedPage = parseInt(page, 10);
    if (Number.isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Query parameter "page" must be a positive integer.'
        }
      });
    }
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Query parameter "limit" must be between 1 and 100.'
        }
      });
    }
  }

  if (status !== undefined && !['all', 'unread', 'read'].includes(status.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_QUERY',
        message: 'Query parameter "status" must be one of: all, unread, read.'
      }
    });
  }

  if (category !== undefined && category !== 'ALL') {
    const normalizedCategory = category.toUpperCase();
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: `Query parameter "category" must be one of: ${VALID_CATEGORIES.join(', ')}.`
        }
      });
    }
  }

  return next();
}

/**
 * Validates notification UUID parameter.
 */
export function validateNotificationId(req, res, next) {
  const { id } = req.params;
  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Notification ID must be a valid UUID.'
      }
    });
  }
  return next();
}

/**
 * Validates notification preferences update payload.
 */
export function validateUpdatePreferences(req, res, next) {
  const allowedFields = [
    'noteModeration',
    'reviewActivity',
    'helpfulVotes',
    'platformAnnouncements',
    'inAppEnabled',
    'emailSecurityAlerts',
    'emailNewNotes',
    'emailAnnouncements',
    'emailLiveActivity',
    'emailAccountUpdates',
    'emailWeeklyDigest'
  ];

  const errors = [];
  const bodyKeys = Object.keys(req.body);

  if (bodyKeys.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_PAYLOAD',
        message: 'At least one preference setting must be provided for update.'
      }
    });
  }

  for (const key of bodyKeys) {
    if (!allowedFields.includes(key)) {
      errors.push(`Field "${key}" is not a recognized notification preference.`);
    } else if (typeof req.body[key] !== 'boolean') {
      errors.push(`Field "${key}" must be a boolean.`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Invalid notification preferences payload.',
        errors
      }
    });
  }

  return next();
}

/**
 * Validates administrative announcement creation payload.
 */
export function validateCreateAnnouncement(req, res, next) {
  const { title, message, targetAudience, targetUrl, priority } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 200) {
    errors.push('Title is required and must be between 3 and 200 characters.');
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    errors.push('Message is required and must be at least 5 characters.');
  }

  if (targetAudience !== undefined && !VALID_AUDIENCES.includes(targetAudience.toUpperCase())) {
    errors.push(`Target audience must be one of: ${VALID_AUDIENCES.join(', ')}.`);
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority.toUpperCase())) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }

  if (targetUrl !== undefined && targetUrl !== null && targetUrl !== '') {
    if (typeof targetUrl !== 'string') {
      errors.push('Target URL must be a string.');
    } else {
      const trimmed = targetUrl.trim();
      if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
        errors.push(
          'Target URL must be a safe internal relative path starting with "/" (e.g. "/notes/explore").'
        );
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Announcement validation failed.',
        errors
      }
    });
  }

  return next();
}
