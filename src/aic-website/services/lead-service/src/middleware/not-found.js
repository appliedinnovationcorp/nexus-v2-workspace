const { StatusCodes } = require('http-status-codes');

const notFound = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ msg: `Route not found: ${req.originalUrl}` });
};

module.exports = { notFound };
