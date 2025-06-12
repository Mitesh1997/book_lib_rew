const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details.map(detail => detail.message)
    });
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({ error: 'Resource already exists' });
      case '23503': // Foreign key violation
        return res.status(400).json({ error: 'Referenced resource does not exist' });
      case '22P02': // Invalid text representation
        return res.status(400).json({ error: 'Invalid data format' });
      default:
        return res.status(500).json({ error: 'Database error occurred' });
    }
  }

  // Default error
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = { errorHandler };