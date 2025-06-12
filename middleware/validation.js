
const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};


// Validation schemas
const schemas = {
    signup: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      name: Joi.string().min(2).max(50).required()
    }),
  
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }),
  
    book: Joi.object({
      title: Joi.string().min(1).max(200).required(),
      author: Joi.string().min(1).max(100).required(),
      genre: Joi.string().min(1).max(50).required(),
      description: Joi.string().max(1000).optional(),
      published_year: Joi.number().integer().min(1000).max(new Date().getFullYear()).optional()
    }),
  
    review: Joi.object({
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().max(1000).optional()
    })
  };
  
  module.exports = { validateRequest, schemas };