const { createHttpError } = require('../utils/httpError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 100;
const MAX_PAGE = 100000;

const pagination = (req, res, next) => {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;

  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;

  if (rawPage !== undefined) {
    const pageStr = String(rawPage);
    if (!/^\d+$/.test(pageStr) || Number(pageStr) < 1) {
      return next(createHttpError(400, 'VALIDATION_ERROR', 'El parámetro page debe ser un entero mayor o igual a 1'));
    }
    // Limitar valores excesivos ("locuras") al máximo permitido
    page = Math.min(Number(pageStr), MAX_PAGE);
  }

  if (rawLimit !== undefined) {
    if (!/^\d+$/.test(String(rawLimit)) || Number(rawLimit) < 1) {
      return next(createHttpError(400, 'VALIDATION_ERROR', 'El parámetro limit debe ser un entero mayor o igual a 1'));
    }
    limit = Number(rawLimit);
    if (limit > MAX_LIMIT) {
      return next(createHttpError(400, 'VALIDATION_ERROR', `El parámetro limit no puede ser mayor a ${MAX_LIMIT}`));
    }
  }

  req.pagination = { page, limit };
  next();
};

module.exports = pagination;
