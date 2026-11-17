require('dotenv').config();

const app = require('./app');
const Database = require('./config/database');

const PORT = Number(process.env.PORT || 3000);
let server;

async function start() {
  const db = Database.getInstance();
  try {
    await db.verifyConnection();
    console.log('Conexión a la base de datos verificada.');

    // Asegurar que el esquema/tabla existan (útil en despliegues nuevos como Render).
    // sync() sin alter NO modifica ni borra datos existentes.
    const schema = process.env.DB_SCHEMA || 'tienda';
    await db.getSequelize().query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    const { Producto } = db.initModels();
    await Producto.sync();
    console.log('Modelo sincronizado con la base de datos.');
  } catch (err) {
    console.error('No se pudo verificar la conexión a la base de datos:', err.message);
    process.exit(1);
  }

  server = app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
  });
}

async function shutdown(signal) {
  console.log(`\nRecibida señal ${signal}. Cerrando servidor...`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    const db = Database.getInstance();
    await db.close();
    console.log('Cierre ordenado completado.');
    process.exit(0);
  } catch (err) {
    console.error('Error durante el cierre:', err.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
