/**
 * Standard pagination utilities for PJ Study database queries and API responses.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Normalizes page and limit parameters from request query strings.
 *
 * @param {{ page?: string | number, limit?: string | number }} query
 * @returns {{ page: number, limit: number, skip: number, take: number }}
 */
export function getPaginationParams(query = {}) {
  const parsedPage = parseInt(String(query.page || ''), 10);
  const parsedLimit = parseInt(String(query.limit || ''), 10);

  const page = !Number.isNaN(parsedPage) && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;
  const limit =
    !Number.isNaN(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
}

/**
 * Builds a standardized paginated response envelope.
 *
 * @template T
 * @param {T[]} items - List of records returned from query
 * @param {number} totalItems - Total matching count across all pages
 * @param {{ page: number, limit: number }} pagination - Active page and limit
 * @returns {{
 *   items: T[],
 *   meta: {
 *     page: number,
 *     limit: number,
 *     totalItems: number,
 *     totalPages: number,
 *     hasNextPage: boolean,
 *     hasPrevPage: boolean
 *   }
 * }}
 */
export function buildPaginatedResponse(items, totalItems, { page, limit }) {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    items,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}
