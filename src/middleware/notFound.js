const { createHttpError } = require('../utils/httpError');

const notFound = (req, res, next) => {
  next(createHttpError(404, 'NOT_FOUND', 'Ruta no encontrada'));
};

module.exports = notFound;
