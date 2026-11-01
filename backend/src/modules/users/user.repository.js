import prisma from '../../config/database.js';

/**
 * Standard user selection fields omitting sensitive credentials like passwordHash.
 */
export const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  bio: true,
  role: true,
  isEmailVerified: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
};

/**
 * Repository handling database access for User records.
 */
export class UserRepository {
  /**
   * Finds a user by ID.
   *
   * @param {string} id
   * @param {boolean} [includeSensitive=false] - Whether to include passwordHash
   * @returns {Promise<any>}
   */
  async findById(id, includeSensitive = false) {
    return prisma.user.findUnique({
      where: { id },
      select: includeSensitive ? undefined : USER_SAFE_SELECT
    });
  }

  /**
   * Finds a user by unique email address.
   *
   * @param {string} email
   * @param {boolean} [includeSensitive=false]
   * @returns {Promise<any>}
   */
  async findByEmail(email, includeSensitive = false) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: includeSensitive ? undefined : USER_SAFE_SELECT
    });
  }

  /**
   * Creates a new user record.
   *
   * @param {object} data
   * @returns {Promise<any>}
   */
  async create(data) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase()
      },
      select: USER_SAFE_SELECT
    });
  }

  /**
   * Updates an existing user record.
   *
   * @param {string} id
   * @param {object} data
   * @returns {Promise<any>}
   */
  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: USER_SAFE_SELECT
    });
  }

  /**
   * Retrieves a paginated list of users.
   *
   * @param {{ skip?: number, take?: number, where?: object }} options
   * @returns {Promise<any[]>}
   */
  async findMany({ skip = 0, take = 10, where = {} } = {}) {
    return prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: USER_SAFE_SELECT
    });
  }

  /**
   * Counts users matching filter conditions.
   *
   * @param {object} [where={}]
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return prisma.user.count({ where });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
