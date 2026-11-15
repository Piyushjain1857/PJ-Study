import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Enterprise Rate Limiters for sensitive platform mutations and resources.
 * Configured with generous limits in dev/test, and strictly enforced in production.
 */

export const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.isProduction ? 30 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest || env.isDevelopment,
  handler: (req, res) => {
    return sendError(
      res,
      'Upload limit reached. Please wait a few minutes before uploading more documents.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

export const reviewSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 30 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest || env.isDevelopment,
  handler: (req, res) => {
    return sendError(
      res,
      'Review submission limit reached. Please wait before submitting more reviews.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

export const reportSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 15 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest || env.isDevelopment,
  handler: (req, res) => {
    return sendError(
      res,
      'Report submission limit reached. Please wait before reporting more items.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

export const adminMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 120 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest || env.isDevelopment,
  handler: (req, res) => {
    return sendError(
      res,
      'Administrative mutation limit reached. Please slow down requests.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

export const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest || env.isDevelopment,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many password modification attempts. Please try again after 15 minutes.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

export default {
  fileUploadLimiter,
  reviewSubmissionLimiter,
  reportSubmissionLimiter,
  adminMutationLimiter,
  passwordChangeLimiter
};
