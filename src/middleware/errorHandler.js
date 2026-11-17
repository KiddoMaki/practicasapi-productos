const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (res.headersSent) {
    return next(err);
  }

  // JSON malformado desde express.json
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'El cuerpo de la solicitud no es un JSON válido',
      },
    });
  }

  // Errores de integridad comunes de PostgreSQL
  if (err && err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Conflicto de integridad de datos' },
    });
  }
  if (err && (err.code === '23503' || err.code === '23502' || err.code === '22P02' || err.code === '22003')) {
    return res.status(422).json({
      success: false,
      error: { code: 'INVALID_DATA', message: 'Los datos no cumplen las restricciones del esquema' },
    });
  }
  if (err && (err.code === 'ECONNREFUSED' || err.code === '57P01' || err.code === '08006' || err.code === '08001')) {
    return res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'No hay conectividad con la base de datos' },
    });
  }

  const status = err.status || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message = status === 500 ? 'Error interno del servidor' : (err.message || 'Error en la solicitud');

  const payload = {
    success: false,
    error: { code, message },
  };
  if (status !== 500 && err.details) {
    payload.error.details = err.details;
  }

  if (status >= 500) {
    console.error(JSON.stringify({ requestId: req.requestId, error: err.message }));
  }

  return res.status(status).json(payload);
};

module.exports = errorHandler;
