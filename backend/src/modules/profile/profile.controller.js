import profileService from './profile.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class ProfileController {
  constructor(service = profileService) {
    this.service = service;
  }

  getMe = async (req, res, next) => {
    try {
      const profile = await this.service.getOwnProfile(req.user.id);
      return sendSuccess(res, profile, 200);
    } catch (err) {
      return next(err);
    }
  };

  updateMe = async (req, res, next) => {
    try {
      const updatedUser = await this.service.updateOwnProfile(req.user.id, req.body);
      return sendSuccess(res, updatedUser, 200);
    } catch (err) {
      return next(err);
    }
  };

  updatePrivacy = async (req, res, next) => {
    try {
      const updatedUser = await this.service.updatePrivacySettings(req.user.id, req.body);
      return sendSuccess(res, updatedUser, 200);
    } catch (err) {
      return next(err);
    }
  };

  uploadAvatar = async (req, res, next) => {
    try {
      const result = await this.service.uploadAvatar(req.user.id, req.file);
      return sendSuccess(res, result, 200);
    } catch (err) {
      return next(err);
    }
  };

  removeAvatar = async (req, res, next) => {
    try {
      const updatedUser = await this.service.removeAvatar(req.user.id);
      return sendSuccess(res, updatedUser, 200);
    } catch (err) {
      return next(err);
    }
  };

  getAvatar = async (req, res, next) => {
    try {
      const { stream, mimeType, size } = await this.service.getAvatarStream(req.params.filename);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      if (size) {
        res.setHeader('Content-Length', size);
      }

      stream.pipe(res);
    } catch (err) {
      return next(err);
    }
  };

  getOwnUploads = async (req, res, next) => {
    try {
      const paginatedUploads = await this.service.getOwnUploads(req.user.id, req.query);
      return sendSuccess(res, paginatedUploads, 200);
    } catch (err) {
      return next(err);
    }
  };

  getOwnStats = async (req, res, next) => {
    try {
      const stats = await this.service.getOwnStats(req.user.id);
      return sendSuccess(res, stats, 200);
    } catch (err) {
      return next(err);
    }
  };

  getAcademicOptions = async (req, res, next) => {
    try {
      const options = await this.service.getAcademicOptions();
      return sendSuccess(res, options, 200);
    } catch (err) {
      return next(err);
    }
  };

  getContributorProfile = async (req, res, next) => {
    try {
      const contributor = await this.service.getPublicContributorProfile(req.params.userId);
      return sendSuccess(res, contributor, 200);
    } catch (err) {
      return next(err);
    }
  };

  getContributorNotes = async (req, res, next) => {
    try {
      const notes = await this.service.getPublicContributorNotes(req.params.userId, req.query);
      return sendSuccess(res, notes, 200);
    } catch (err) {
      return next(err);
    }
  };
}

export const profileController = new ProfileController();
export default profileController;
