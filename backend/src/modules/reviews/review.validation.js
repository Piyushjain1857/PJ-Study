import { sendError } from '../../utils/apiResponse.js';

const VALID_REPORT_REASONS = ['SPAM', 'HARASSMENT', 'OFFENSIVE', 'MISLEADING', 'OTHER'];
const VALID_SORT_OPTIONS = ['newest', 'oldest', 'highest_rating', 'lowest_rating', 'most_helpful'];

/**
 * Validates review submission payload.
 */
export function validateSubmitReview(req, res, next) {
  const { rating, comment } = req.body || {};
  const errors = [];

  const parsedRating = Number(rating);
  if (
    rating === undefined ||
    rating === null ||
    !Number.isInteger(parsedRating) ||
    parsedRating < 1 ||
    parsedRating > 5
  ) {
    errors.push('Rating must be an integer between 1 and 5 stars.');
  }

  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string') {
      errors.push('Review comment must be a text string.');
    } else if (comment.trim().length > 2000) {
      errors.push('Review comment cannot exceed 2,000 characters.');
    }
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed for review submission',
      422,
      'VALIDATION_ERROR',
      errors
    );
  }

  req.validatedBody = {
    rating: parsedRating,
    comment: typeof comment === 'string' ? comment.trim() : null
  };

  next();
}

/**
 * Validates review update payload.
 */
export function validateUpdateReview(req, res, next) {
  const { rating, comment } = req.body || {};
  const errors = [];

  if (rating === undefined && comment === undefined) {
    return sendError(
      res,
      'At least one field (rating or comment) is required to update review.',
      400
    );
  }

  let parsedRating;
  if (rating !== undefined) {
    parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      errors.push('Rating must be an integer between 1 and 5 stars.');
    }
  }

  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string') {
      errors.push('Review comment must be a text string.');
    } else if (comment.trim().length > 2000) {
      errors.push('Review comment cannot exceed 2,000 characters.');
    }
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for review update', 422, 'VALIDATION_ERROR', errors);
  }

  req.validatedBody = {
    ...(parsedRating !== undefined ? { rating: parsedRating } : {}),
    ...(comment !== undefined
      ? { comment: typeof comment === 'string' ? comment.trim() : null }
      : {})
  };

  next();
}

/**
 * Validates review report payload.
 */
export function validateReportReview(req, res, next) {
  const { reason, description } = req.body || {};
  const errors = [];

  if (
    !reason ||
    typeof reason !== 'string' ||
    !VALID_REPORT_REASONS.includes(reason.toUpperCase())
  ) {
    errors.push(`Report reason must be one of: ${VALID_REPORT_REASONS.join(', ')}.`);
  }

  if (reason && reason.toUpperCase() === 'OTHER') {
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.push('Description is required when selecting "Other" as the report reason.');
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push('Report description must be a string.');
    } else if (description.trim().length > 1000) {
      errors.push('Report description cannot exceed 1,000 characters.');
    }
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for review report', 422, 'VALIDATION_ERROR', errors);
  }

  req.validatedBody = {
    reason: reason.toUpperCase(),
    description: typeof description === 'string' ? description.trim() : null
  };

  next();
}

/**
 * Validates review query parameters.
 */
export function validateReviewQuery(req, res, next) {
  const { sort } = req.query;

  if (sort && !VALID_SORT_OPTIONS.includes(sort)) {
    return sendError(
      res,
      `Invalid sort parameter. Allowed values: ${VALID_SORT_OPTIONS.join(', ')}.`,
      400,
      'INVALID_QUERY_PARAM'
    );
  }

  next();
}
