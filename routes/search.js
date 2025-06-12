const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Search books by title or author
router.get('/', async (req, res, next) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const offset = (pageNum - 1) * limitNum;

    const searchQuery = `
      SELECT b.*, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as review_count
      FROM books b
      LEFT JOIN reviews r ON b.id = r.book_id
      WHERE LOWER(b.title) LIKE LOWER($1) OR LOWER(b.author) LIKE LOWER($1)
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const searchTerm = `%${query.trim()}%`;
    const result = await pool.query(searchQuery, [searchTerm, limitNum, offset]);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM books 
      WHERE LOWER(title) LIKE LOWER($1) OR LOWER(author) LIKE LOWER($1)
    `;
    const countResult = await pool.query(countQuery, [searchTerm]);
    const totalBooks = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalBooks / limitNum);

    res.json({
      query: query.trim(),
      books: result.rows.map(book => ({
        ...book,
        average_rating: parseFloat(book.average_rating).toFixed(1),
        review_count: parseInt(book.review_count)
      })),
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_books: totalBooks,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;