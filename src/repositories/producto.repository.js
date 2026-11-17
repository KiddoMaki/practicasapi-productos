const Database = require('../config/database');

const ATTRIBUTES = ['id', 'nombre', 'categoria', 'precio_venta_publico'];

/**
 * Repositorio de productos basado en el modelo Sequelize (ORM).
 * Centraliza todo el acceso a datos sin SQL crudo.
 */
class ProductoRepository {
  constructor() {
    const db = Database.getInstance();
    this.Producto = db.initModels().Producto;
  }

  async count() {
    return this.Producto.count();
  }

  async findAll({ page, limit }) {
    const offset = (page - 1) * limit;
    const rows = await this.Producto.findAll({
      attributes: ATTRIBUTES,
      order: [['id', 'ASC']],
      limit,
      offset,
      raw: true,
    });
    return rows.map((row) => ({ ...row, precio_venta_publico: Number(row.precio_venta_publico) }));
  }

  async findById(id) {
    const row = await this.Producto.findByPk(id, {
      attributes: ATTRIBUTES,
      raw: true,
    });
    if (!row) return null;
    return { ...row, precio_venta_publico: Number(row.precio_venta_publico) };
  }

  async create(data) {
    const created = await this.Producto.create(data);
    return this.findById(created.id);
  }

  async update(id, data) {
    const { nombre, categoria, precio_venta_publico } = data;
    await this.Producto.update(
      { nombre, categoria, precio_venta_publico },
      { where: { id } }
    );
    return this.findById(id);
  }

  async partialUpdate(id, data) {
    const allowed = ['nombre', 'categoria', 'precio_venta_publico'];
    const values = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        values[key] = data[key];
      }
    }

    if (Object.keys(values).length === 0) {
      return null;
    }

    await this.Producto.update(values, { where: { id } });
    return this.findById(id);
  }

  async delete(id) {
    const deleted = await this.Producto.destroy({ where: { id } });
    return deleted > 0;
  }
}

module.exports = ProductoRepository;
