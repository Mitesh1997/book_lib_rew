const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

// Add a new book (authenticated users only)
router.post('/', authenticateToken, validateRequest(schemas.book), async (req, res, next) => {
  try {
    const { title, author, genre, description, published_year } = req.body;

    const result = await pool.query(
      `INSERT INTO books (title, author, genre, description, published_year, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, title, author, genre, description, published_year, created_at`,
      [title, author, genre, description, published_year, req.user.id]
    );

    res.status(201).json({
      message: 'Book added successfully',
      book: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Get all books with pagination and filters
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;
    const { author, genre } = req.query;

    let query = `
      SELECT b.*, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as review_count
      FROM books b
      LEFT JOIN reviews r ON b.id = r.book_id
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 0;

    if (author) {
      paramCount++;
      conditions.push(`LOWER(b.author) LIKE LOWER($${paramCount})`);
      values.push(`%${author}%`);
    }

    if (genre) {
      paramCount++;
      conditions.push(`LOWER(b.genre) = LOWER($${paramCount})`);
      values.push(genre);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` GROUP BY b.id ORDER BY b.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM books b';
    let countValues = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countValues = values.slice(0, -2); // Remove limit and offset
    }

    const countResult = await pool.query(countQuery, countValues);
    const totalBooks = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      books: result.rows.map(book => ({
        ...book,
        average_rating: parseFloat(book.average_rating).toFixed(1),
        review_count: parseInt(book.review_count)
      })),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_books: totalBooks,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get book details by ID with reviews
router.get('/:id', async (req, res, next) => {
  try {
    const bookId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const offset = (page - 1) * limit;

    // Get book details with average rating
    const bookResult = await pool.query(`
      SELECT b.*, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as review_count
      FROM books b
      LEFT JOIN reviews r ON b.id = r.book_id
      WHERE b.id = $1
      GROUP BY b.id
    `, [bookId]);

    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Get reviews with pagination
    const reviewsResult = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at,
             u.name as reviewer_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.book_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [bookId, limit, offset]);

    // Get total review count for pagination
    const reviewCountResult = await pool.query(
      'SELECT COUNT(*) FROM reviews WHERE book_id = $1',
      [bookId]
    );

    const totalReviews = parseInt(reviewCountResult.rows[0].count);
    const totalPages = Math.ceil(totalReviews / limit);

    const book = bookResult.rows[0];

    res.json({
      book: {
        ...book,
        average_rating: parseFloat(book.average_rating).toFixed(1),
        review_count: parseInt(book.review_count)
      },
      reviews: reviewsResult.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_reviews: totalReviews,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// Submit a review for a book
router.post('/:id/reviews', authenticateToken, validateRequest(schemas.review), async (req, res, next) => {
  try {
    const bookId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if book exists
    const bookResult = await pool.query('SELECT id FROM books WHERE id = $1', [bookId]);
    
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if user already reviewed this book
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE book_id = $1 AND user_id = $2',
      [bookId, userId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this book' });
    }

    // Create review
    const result = await pool.query(`
      INSERT INTO reviews (book_id, user_id, rating, comment) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, book_id, rating, comment, created_at
    `, [bookId, userId, rating, comment]);

    res.status(201).json({
      message: 'Review submitted successfully',
      review: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;