import prisma from '../../config/database.js';

export class CategoryRepository {
  async findAll({ isActive = true } = {}) {
    return prisma.category.findMany({
      where: isActive !== undefined ? { isActive } : {},
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { notes: { where: { status: 'APPROVED' } } }
        }
      }
    });
  }

  async findById(id) {
    return prisma.category.findUnique({
      where: { id }
    });
  }

  async findBySlug(slug) {
    return prisma.category.findUnique({
      where: { slug }
    });
  }

  async create(data) {
    return prisma.category.create({ data });
  }

  async update(id, data) {
    return prisma.category.update({
      where: { id },
      data
    });
  }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
