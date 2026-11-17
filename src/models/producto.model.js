const { DataTypes } = require('sequelize');

/**
 * Define el modelo Sequelize para la tabla real `tienda.productos`.
 * No crea ni altera la tabla: solo mapea las columnas existentes.
 */
module.exports = (sequelize) => {
  return sequelize.define(
    'Producto',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      categoria: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      precio_venta_publico: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          const value = this.getDataValue('precio_venta_publico');
          return value === null || value === undefined ? value : Number(value);
        },
      },
    },
    {
      tableName: 'productos',
      schema: process.env.DB_SCHEMA || 'tienda',
      timestamps: false,
      freezeTableName: true,
    }
  );
};
