const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const origins = corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);

const securityHeaders = helmet();

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permitir herramientas sin origen (Postman/curl) y orígenes configurados
    if (!origin || origins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiadas solicitudes, intente más tarde' },
  },
});

module.exports = { securityHeaders, corsMiddleware, limiter };
