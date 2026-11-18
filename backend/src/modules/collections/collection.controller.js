import collectionService from './collection.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export class CollectionController {
  constructor(service = collectionService) {
    this.service = service;
  }

  listCollections = async (req, res, next) => {
    try {
      const collections = await this.service.getMyCollections(req.user.id);
      return sendSuccess(res, collections);
    } catch (err) {
      return next(err);
    }
  };

  getCollection = async (req, res, next) => {
    try {
      const collection = await this.service.getCollectionById(req.params.id, req.user.id);
      return sendSuccess(res, collection);
    } catch (err) {
      return next(err);
    }
  };

  createCollection = async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const collection = await this.service.createCollection(req.user.id, { name, description });
      return sendSuccess(res, collection, 201, 'Study collection created successfully.');
    } catch (err) {
      return next(err);
    }
  };

  updateCollection = async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const updated = await this.service.updateCollection(req.params.id, req.user.id, { name, description });
      return sendSuccess(res, updated, 200, 'Study collection updated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  deleteCollection = async (req, res, next) => {
    try {
      const result = await this.service.deleteCollection(req.params.id, req.user.id);
      return sendSuccess(res, result, 200, 'Study collection deleted successfully.');
    } catch (err) {
      return next(err);
    }
  };

  addNote = async (req, res, next) => {
    try {
      const { noteId } = req.body;
      if (!noteId) {
        return sendError(res, 'noteId is required in payload.', 400, 'NOTE_ID_REQUIRED');
      }
      const result = await this.service.addNoteToCollection(req.params.id, req.user.id, noteId);
      return sendSuccess(res, result, 200, 'Note added to collection successfully.');
    } catch (err) {
      return next(err);
    }
  };

  removeNote = async (req, res, next) => {
    try {
      const result = await this.service.removeNoteFromCollection(req.params.id, req.user.id, req.params.noteId);
      return sendSuccess(res, result, 200, 'Note removed from collection successfully.');
    } catch (err) {
      return next(err);
    }
  };
}

export const collectionController = new CollectionController();
export default collectionController;
