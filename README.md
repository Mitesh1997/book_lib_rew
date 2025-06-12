🔧 Installation & Setup
1. Clone the repository
bashgit clone <LINK>

cd book-review-api
2. Install dependencies
bashnpm install


# Run the schema
psql -d book_review_db -f schema.sql
4. Configure environment variables
Create a .env file in the root directory:
envNODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/book_review_db
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
5. Start the server
bash# Development mode with auto-restart
npm run dev

# Production mode
npm start
The server will start on http://localhost:3000
📊 Database Schema
Tables:

users: User accounts with authentication
books: Book information and metadata
reviews: Book reviews with ratings and comments

Relationships:

Users can create multiple books
Users can write one review per book
Books can have multiple reviews
Reviews belong to both a user and a book

🔗 API Endpoints
Authentication
Register User
bashPOST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
Login User
bashPOST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
Books
Add New Book (Authentication Required)
bashPOST /api/books
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "genre": "Fiction",
  "description": "A classic American novel",
  "published_year": 1925
}
Get All Books (with pagination and filters)
bash# Basic request
GET /api/books

# With pagination
GET /api/books?page=1&limit=10

# With filters
GET /api/books?author=Shakespeare&genre=Drama

# Combined
GET /api/books?page=1&limit=5&author=Orwell
Get Book Details
bash# Get book with reviews (paginated)
GET /api/books/:id

# With review pagination
GET /api/books/:id?page=1&limit=5
Submit Review (Authentication Required)
bashPOST /api/books/:id/reviews
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent book! Highly recommended."
}
Reviews
Update Review (Authentication Required)
bashPUT /api/reviews/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated review comment"
}
Delete Review (Authentication Required)
bashDELETE /api/reviews/:id
Authorization: Bearer <jwt-token>
Search
Search Books
bash# Search by title or author
GET /api/search?q=gatsby

# With pagination
GET /api/search?q=shakespeare&page=1&limit=10
📝 Example API Usage
Complete workflow example:

Register a new user:

bashcurl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reader@example.com",
    "password": "securepassword",
    "name": "Book Reader"
  }'

Login to get JWT token:

bashcurl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reader@example.com",
    "password": "securepassword"
  }'

Add a new book:

bashcurl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dune",
    "author": "Frank Herbert",
    "genre": "Science Fiction",
    "description": "Epic space opera novel",
    "published_year": 1965
  }'

Get all books:

bashcurl http://localhost:3000/api/books

Submit a review:

bashcurl -X POST http://localhost:3000/api/books/1/reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Amazing book! The world-building is incredible."
  }'

Search books:

bashcurl "http://localhost:3000/api/search?q=dune"
✅ Validation Rules
User Registration:

Email: Must be valid email format
Password: Minimum 6 characters
Name: 2-50 characters

Book Creation:

Title: 1-200 characters, required
Author: 1-100 characters, required
Genre: 1-50 characters, required
Description: Maximum 1000 characters, optional
Published Year: Valid year between 1000 and current year, optional

Review Submission:

Rating: Integer between 1-5, required
Comment: Maximum 1000 characters, optional

🔒 Security Features

Password Hashing: bcryptjs with salt rounds of 12
JWT Authentication: Secure token-based authentication
Rate Limiting: 100 requests per 15 minutes per IP
Input Validation: Comprehensive validation using Joi
SQL Injection Protection: Parameterized queries
Security Headers: Helmet middleware for security headers
CORS: Configurable cross-origin resource sharing

📊 Response Format
Success Response:
json{
  "message": "Operation successful",
  "data": {...},
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "has_next": true,
    "has_prev": false
  }
}
Error Response:
json{
  "error": "Error message",
  "details": ["Detailed error information"]
}
🚦 HTTP Status Codes

200 - OK (Success)
201 - Created (Resource created successfully)
400 - Bad Request (Validation error)
401 - Unauthorized (Authentication required)
403 - Forbidden (Invalid/expired token)
404 - Not Found (Resource not found)
409 - Conflict (Resource already exists)
429 - Too Many Requests (Rate limit exceeded)
500 - Internal Server Error

🧪 Testing the API
You can test the API using:
Postman Collection
Import the following into Postman:

Base URL: http://localhost:3000/api
Set up environment variables for token and base_url

🔄 Design Decisions & Assumptions
Database Design:

PostgreSQL chosen for ACID compliance and robust relationship management
Composite unique constraint on (book_id, user_id) ensures one review per user per book
Soft delete approach could be implemented but hard delete used for simplicity
Created_by field in books table allows tracking who added each book

Authentication:

JWT tokens for stateless authentication
7-day expiration for tokens (configurable)
bcryptjs with 12 salt rounds for password hashing
Email-based authentication (could extend to username)

API Design:

RESTful principles followed throughout
Consistent response format with proper HTTP status codes
Pagination implemented for all list endpoints
Case-insensitive search for better user experience

Validation:

Server-side validation using Joi for all inputs
Database constraints as additional safety layer
Input sanitization to prevent injection attacks

Performance:

Database indexes on frequently queried columns
Pagination to limit response sizes
Rate limiting to prevent abuse
Connection pooling for database efficiency

🚀 Deployment Notes
Environment Variables for Production:
envNODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=very-long-random-secret-key
JWT_EXPIRES_IN=7d
Production Considerations:

Use environment-specific database
Set up proper logging (Winston, Morgan)
Implement monitoring and health checks
Use HTTPS in production
Consider using Redis for session storage
Set up database backups
Configure proper CORS for production domains



JWT Token Invalid:

Check JWT_SECRET in .env file
Verify token format: "Bearer <token>"
Ensure token hasn't expired


Validation Errors:

Check request body format
Verify all required fields are provided
Ensure data types match schema requirements


Port Already in Use:

Change PORT in .env file
Kill existing processes using the port


