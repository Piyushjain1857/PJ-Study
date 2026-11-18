import collectionRepository from './collection.repository.js';
import prisma from '../../config/database.js';

export class CollectionService {
  constructor(repo = collectionRepository) {
    this.repo = repo;
  }

  async getMyCollections(userId) {
    const list = await this.repo.listByUser(userId);
    return list.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      itemCount: c._count.items,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));
  }

  async getCollectionById(id, userId) {
    const collection = await this.repo.findById(id);
    if (!collection) {
      const err = new Error('Study collection was not found.');
      err.statusCode = 404;
      err.code = 'COLLECTION_NOT_FOUND';
      throw err;
    }

    if (collection.userId !== userId) {
      const err = new Error('Access denied: you do not own this private collection.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_COLLECTION_ACCESS';
      throw err;
    }

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      itemCount: collection._count.items,
      notes: collection.items.map((i) => i.note),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt
    };
  }

  async createCollection(userId, { name, description }) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const err = new Error('Collection name is required.');
      err.statusCode = 400;
      err.code = 'COLLECTION_NAME_REQUIRED';
      throw err;
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 120) {
      const err = new Error('Collection name cannot exceed 120 characters.');
      err.statusCode = 400;
      err.code = 'COLLECTION_NAME_TOO_LONG';
      throw err;
    }

    const existing = await this.repo.findByName(userId, trimmedName);
    if (existing) {
      const err = new Error(`A study collection named "${trimmedName}" already exists.`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_COLLECTION_NAME';
      throw err;
    }

    const created = await this.repo.create({ userId, name: trimmedName, description });
    return {
      id: created.id,
      name: created.name,
      description: created.description,
      itemCount: created._count.items,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    };
  }

  async updateCollection(id, userId, { name, description }) {
    const collection = await this.repo.findById(id);
    if (!collection) {
      const err = new Error('Study collection was not found.');
      err.statusCode = 404;
      err.code = 'COLLECTION_NOT_FOUND';
      throw err;
    }

    if (collection.userId !== userId) {
      const err = new Error('Access denied: you do not own this private collection.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_COLLECTION_ACCESS';
      throw err;
    }

    if (name && typeof name === 'string' && name.trim() !== collection.name) {
      const trimmedName = name.trim();
      const existing = await this.repo.findByName(userId, trimmedName);
      if (existing) {
        const err = new Error(`A study collection named "${trimmedName}" already exists.`);
        err.statusCode = 409;
        err.code = 'DUPLICATE_COLLECTION_NAME';
        throw err;
      }
    }

    const updated = await this.repo.update(id, { name, description });
    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      itemCount: updated._count.items,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  }

  async deleteCollection(id, userId) {
    const collection = await this.repo.findById(id);
    if (!collection) {
      const err = new Error('Study collection was not found.');
      err.statusCode = 404;
      err.code = 'COLLECTION_NOT_FOUND';
      throw err;
    }

    if (collection.userId !== userId) {
      const err = new Error('Access denied: you do not own this private collection.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_COLLECTION_ACCESS';
      throw err;
    }

    await this.repo.delete(id);
    return { id, deleted: true };
  }

  async addNoteToCollection(collectionId, userId, noteId) {
    const collection = await this.repo.findById(collectionId);
    if (!collection) {
      const err = new Error('Study collection was not found.');
      err.statusCode = 404;
      err.code = 'COLLECTION_NOT_FOUND';
      throw err;
    }

    if (collection.userId !== userId) {
      const err = new Error('Access denied: you do not own this private collection.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_COLLECTION_ACCESS';
      throw err;
    }

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) {
      const err = new Error(`Note with ID "${noteId}" was not found.`);
      err.statusCode = 404;
      err.code = 'NOTE_NOT_FOUND';
      throw err;
    }

    const alreadyIn = await this.repo.hasNote(collectionId, noteId);
    if (alreadyIn) {
      const err = new Error('This note is already in the study collection.');
      err.statusCode = 409;
      err.code = 'NOTE_ALREADY_IN_COLLECTION';
      throw err;
    }

    await this.repo.addNote(collectionId, noteId);
    return { collectionId, noteId, added: true };
  }

  async removeNoteFromCollection(collectionId, userId, noteId) {
    const collection = await this.repo.findById(collectionId);
    if (!collection) {
      const err = new Error('Study collection was not found.');
      err.statusCode = 404;
      err.code = 'COLLECTION_NOT_FOUND';
      throw err;
    }

    if (collection.userId !== userId) {
      const err = new Error('Access denied: you do not own this private collection.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_COLLECTION_ACCESS';
      throw err;
    }

    await this.repo.removeNote(collectionId, noteId);
    return { collectionId, noteId, removed: true };
  }
}

export const collectionService = new CollectionService();
export default collectionService;
