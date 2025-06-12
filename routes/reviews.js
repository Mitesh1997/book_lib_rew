const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Update user's own review
router.put('/:id', authenticateToken, validateRequest(schemas.review), async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const reviewResult = await pool.query(
      'SELECT id FROM reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or you are not authorized to update it' });
    }

    // Update review
    const result = await pool.query(`
      UPDATE reviews 
      SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 AND user_id = $4
      RETURNING id, book_id, rating, comment, created_at, updated_at
    `, [rating, comment, reviewId, userId]);

    res.json({
      message: 'Review updated successfully',
      review: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Delete user's own review
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const reviewResult = await pool.query(
      'SELECT id FROM reviews WHERE id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or you are not authorized to delete it' });
    }

    // Delete review
    await pool.query('DELETE FROM reviews WHERE id = $1 AND user_id = $2', [reviewId, userId]);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;