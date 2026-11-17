const express = require('express');
const path = require('path');
const requestLogger = require('./middleware/requestLogger');
const { securityHeaders, corsMiddleware, limiter } = require('./middleware/security');
const { sanitizeBody } = require('./middleware/sanitize');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const productoRoutes = require('./routes/producto.routes');
const Database = require('./config/database');

const app = express();

// 1. Identificador de solicitud y logs de inicio/fin
app.use(requestLogger);

// 2. Seguridad básica
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(limiter);

// 3. Parsing JSON y manejo de JSON malformado (delegado a errorHandler via SyntaxError)
app.use(express.json({ limit: '100kb' }));

// 4. Sanitización conservadora
app.use(sanitizeBody);

// Rutas
app.get('/health', async (req, res) => {
  try {
    const db = Database.getInstance();
    await db.verifyConnection();
    return res.status(200).json({
      success: true,
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// 5-7. Validación/paginación dentro de rutas + controlador
app.use('/api/productos', productoRoutes);

// Frontend estático (gestión básica)
app.use(express.static(path.join(__dirname, '..', 'public')));

// 8. 404 y manejador global de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;
