import recommendationService from './recommendation.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class RecommendationController {
  constructor(service = recommendationService) {
    this.service = service;
  }

  /**
   * GET /api/v1/recommendations/notes
   * Personalized recommendations for authenticated student.
   */
  getPersonalized = async (req, res, next) => {
    try {
      const data = await this.service.getPersonalizedRecommendations(req.user.id, req.query);
      return sendSuccess(res, data, 200, 'Personalized recommendations generated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/v1/recommendations/notes/similar/:noteId
   * Contextual similar notes for Note Details page.
   */
  getSimilar = async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      const data = await this.service.getSimilarNotes(req.params.noteId, limit);
      return sendSuccess(res, data, 200, 'Similar notes retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/v1/recommendations/notes/subjects
   * Subject-based recommendations for authenticated student.
   */
  getSubjectRecommendations = async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      const data = await this.service.getSubjectBasedRecommendations(req.user.id, limit);
      return sendSuccess(res, data, 200, 'Subject recommendations retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/v1/recommendations/notes/recent
   * Recently approved public notes.
   */
  getRecent = async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      const data = await this.service.getRecentRecommendations(limit);
      return sendSuccess(res, data, 200, 'Recently approved notes retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/v1/recommendations/notes/popular
   * Popular approved notes.
   */
  getPopular = async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      const data = await this.service.getPopularRecommendations(limit);
      return sendSuccess(res, data, 200, 'Popular study notes retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };
}

export const recommendationController = new RecommendationController();
export default recommendationController;
