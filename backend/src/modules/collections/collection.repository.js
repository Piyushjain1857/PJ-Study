import prisma from '../../config/database.js';

export class CollectionRepository {
  /**
   * Lists all study collections owned by the user.
   */
  async listByUser(userId) {
    return prisma.studyCollection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
  }

  /**
   * Finds a collection by ID including its contained notes.
   */
  async findById(id) {
    return prisma.studyCollection.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            note: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                courseId: true,
                subjectId: true,
                downloadCount: true,
                viewCount: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { items: true }
        }
      }
    });
  }

  /**
   * Finds a collection by user and name (to prevent duplicates).
   */
  async findByName(userId, name) {
    return prisma.studyCollection.findUnique({
      where: {
        user_collection_name_unique: {
          userId,
          name: name.trim()
        }
      }
    });
  }

  /**
   * Creates a new study collection.
   */
  async create({ userId, name, description }) {
    return prisma.studyCollection.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
  }

  /**
   * Updates an existing collection name and/or description.
   */
  async update(id, { name, description }) {
    const data = {};
    if (name) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;

    return prisma.studyCollection.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
  }

  /**
   * Deletes a study collection (cascades to items).
   */
  async delete(id) {
    return prisma.studyCollection.delete({
      where: { id }
    });
  }

  /**
   * Adds a note to a collection.
   */
  async addNote(collectionId, noteId) {
    return prisma.studyCollectionItem.create({
      data: {
        collectionId,
        noteId
      }
    });
  }

  /**
   * Removes a note from a collection.
   */
  async removeNote(collectionId, noteId) {
    return prisma.studyCollectionItem.deleteMany({
      where: {
        collectionId,
        noteId
      }
    });
  }

  /**
   * Checks if a note is in a collection.
   */
  async hasNote(collectionId, noteId) {
    const item = await prisma.studyCollectionItem.findUnique({
      where: {
        collection_note_unique: {
          collectionId,
          noteId
        }
      }
    });
    return Boolean(item);
  }
}

export const collectionRepository = new CollectionRepository();
export default collectionRepository;
