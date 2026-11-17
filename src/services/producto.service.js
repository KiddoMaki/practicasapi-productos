const { createHttpError } = require('../utils/httpError');

class ProductoService {
  constructor(repository) {
    this.repository = repository;
  }

  async list({ page, limit, baseUrl }) {
    const total = await this.repository.count();
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;

    const data = await this.repository.findAll({ page: safePage, limit });

    const prevPage = safePage > 1 ? safePage - 1 : null;
    const nextPage = totalPages > 0 && safePage < totalPages ? safePage + 1 : null;

    const buildUrl = (p) => {
      if (!p || !baseUrl) return null;
      return `${baseUrl}?page=${p}&limit=${limit}`;
    };

    return {
      data,
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
        prevPage,
        nextPage,
        prev: buildUrl(prevPage),
        next: buildUrl(nextPage),
      },
    };
  }

  async getById(id) {
    const producto = await this.repository.findById(id);
    if (!producto) {
      throw createHttpError(404, 'NOT_FOUND', 'Producto no encontrado');
    }
    return producto;
  }

  async create(data) {
    return this.repository.create(data);
  }

  async replace(id, data) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw createHttpError(404, 'NOT_FOUND', 'Producto no encontrado');
    }
    return this.repository.update(id, data);
  }

  async updatePartial(id, data) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw createHttpError(404, 'NOT_FOUND', 'Producto no encontrado');
    }
    if (Object.keys(data).length === 0) {
      throw createHttpError(422, 'VALIDATION_ERROR', 'Debe enviar al menos un campo para actualizar');
    }
    const updated = await this.repository.partialUpdate(id, data);
    return updated || existing;
  }

  async remove(id) {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw createHttpError(404, 'NOT_FOUND', 'Producto no encontrado');
    }
  }
}

module.exports = ProductoService;
