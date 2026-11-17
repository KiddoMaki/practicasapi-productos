const fs = require('fs');
const path = require('path');
const Database = require('../src/config/database');

/**
 * Carga los datos de prueba en tienda.productos SOLO si la tabla está vacía.
 * Se ejecuta automáticamente al arrancar el servidor (local y Render).
 */
async function seedIfEmpty() {
  const db = Database.getInstance();
  const sequelize = db.getSequelize();
  const schema = process.env.DB_SCHEMA || 'tienda';

  // Cuidado: count() del ORM ya usa la tabla mapeada; si no existe, falla.
  // Por eso se llama después de Producto.sync() en server.js.
  const [rows] = await sequelize.query(
    `SELECT COUNT(*)::int AS count FROM "${schema}".productos`
  );
  const count = rows[0].count;

  if (Number(count) > 0) {
    console.log(`[seed] La tabla ya tiene ${count} registros. No se carga nada.`);
    return false;
  }

  const sqlPath = path.join(__dirname, 'seed.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await sequelize.query(sql);
  console.log('[seed] Datos de prueba cargados correctamente.');
  return true;
}

module.exports = seedIfEmpty;

// Permite ejecutarlo manualmente: node db/seed.js
if (require.main === module) {
  require('dotenv').config();
  const db = Database.getInstance();
  db.initModels();
  seedIfEmpty()
    .then(() => db.close())
    .catch((err) => {
      console.error('[seed] Error:', err.message);
      process.exit(1);
    });
}
