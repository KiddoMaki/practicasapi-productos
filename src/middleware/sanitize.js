const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  // Normalización conservadora: eliminar espacios extremos y caracteres de control
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
};

module.exports = { sanitizeBody };
