import userRepository from './user.repository.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

const VALID_ROLES = ['STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

/**
 * Service encapsulating business logic, invariant enforcement, and user flows.
 */
export class UserService {
  /**
   * Retrieves user profile by unique ID.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async getUserById(id) {
    if (!id || typeof id !== 'string') {
      const error = new Error('A valid User ID string is required.');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error(`User with ID "${id}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Creates a new user account with role validation and duplicate email checks.
   *
   * @param {{
   *   name: string,
   *   email: string,
   *   passwordHash: string,
   *   role?: 'STUDENT' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN',
   *   avatarUrl?: string,
   *   bio?: string
   * }} input
   * @returns {Promise<any>}
   */
  async createUser(input) {
    const { name, email, passwordHash, role = 'STUDENT', avatarUrl, bio } = input;

    if (!name || name.trim().length === 0) {
      const error = new Error('User name is required.');
      error.statusCode = 400;
      throw error;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const error = new Error('A valid email address is required.');
      error.statusCode = 400;
      throw error;
    }

    if (!passwordHash) {
      const error = new Error('Password hash is required for account creation.');
      error.statusCode = 400;
      throw error;
    }

    if (!VALID_ROLES.includes(role)) {
      const error = new Error(
        `Invalid user role "${role}". Must be one of: ${VALID_ROLES.join(', ')}.`
      );
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error(`An account with email "${email}" already exists.`);
      error.statusCode = 409;
      throw error;
    }

    return userRepository.create({
      name: name.trim(),
      email: email.trim(),
      passwordHash,
      role,
      avatarUrl: avatarUrl?.trim() || null,
      bio: bio?.trim() || null
    });
  }

  /**
   * Lists users with pagination and role filters.
   *
   * @param {{ page?: string | number, limit?: string | number, role?: string, isActive?: boolean }} query
   * @returns {Promise<any>}
   */
  async listUsers(query = {}) {
    const pagination = getPaginationParams(query);
    const where = {};

    if (query.role && VALID_ROLES.includes(query.role)) {
      where.role = query.role;
    }

    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    }

    const [items, totalItems] = await Promise.all([
      userRepository.findMany({
        skip: pagination.skip,
        take: pagination.take,
        where
      }),
      userRepository.count(where)
    ]);

    return buildPaginatedResponse(items, totalItems, pagination);
  }
}

export const userService = new UserService();
export default userService;
