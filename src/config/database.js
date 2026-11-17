const { Sequelize } = require('sequelize');

let instance = null;

/**
 * Singleton que administra una única instancia de Sequelize (ORM) durante
 * toda la vida del proceso. Todos los modelos/repositorios comparten esta
 * instancia y su pool interno de conexiones.
 */
class Database {
  constructor() {
    if (instance) {
      return instance;
    }

    const useUrl = Boolean(process.env.DATABASE_URL);
    const schema = process.env.DB_SCHEMA || 'tienda';

    const options = {
      dialect: 'postgres',
      logging: false,
      define: {
        // La tabla real ya existe: Sequelize no debe crearla ni modificarla
        timestamps: false,
        freezeTableName: true,
        schema,
      },
      pool: {
        max: Number(process.env.DB_POOL_MAX || 10),
        min: 0,
        idle: 30000,
        acquire: 5000,
      },
      dialectOptions: {
        // Render (y la mayoría de hosts de Postgres) exigen SSL
        ssl: process.env.DB_SSL === 'true'
          ? { require: true, rejectUnauthorized: false }
          : undefined,
      },
    };

    this.sequelize = useUrl
      ? new Sequelize(process.env.DATABASE_URL, options)
      : new Sequelize(
          process.env.DB_NAME,
          process.env.DB_USER,
          process.env.DB_PASSWORD,
          {
            ...options,
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 5432),
          }
        );

    this.models = {};
    instance = this;
  }

  static getInstance() {
    if (!instance) {
      instance = new Database();
    }
    return instance;
  }

  getSequelize() {
    return this.sequelize;
  }

  /** Registra los modelos una sola vez ( patrón Singleton de modelos ). */
  initModels() {
    if (!this.models.Producto) {
      // Carga diferida para evitar ciclos de require
      const defineProducto = require('../models/producto.model');
      this.models.Producto = defineProducto(this.sequelize);
    }
    return this.models;
  }

  async verifyConnection() {
    await this.sequelize.authenticate();
    return true;
  }

  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
    }
  }
}

module.exports = Database;
