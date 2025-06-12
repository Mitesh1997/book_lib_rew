
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Register user
router.post('/signup', validateRequest(schemas.signup), async (req, res, next) => {
    try {
      const { email, password, name } = req.body;
  
      // Check if user already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }
  
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Create user
      const result = await pool.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
        [email, hashedPassword, name]
      );
  
      const user = result.rows[0];
  
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
  
      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        },
        token
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Login user
  router.post('/login', validateRequest(schemas.login), async (req, res, next) => {
    try {
      const { email, password } = req.body;
  
      // Find user
      const result = await pool.query(
        'SELECT id, email, name, password, created_at FROM users WHERE email = $1',
        [email]
      );
  
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const user = result.rows[0];
  
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
  
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        },
        token
      });
    } catch (error) {
      next(error);
    }
  });
  
  module.exports = router;
  