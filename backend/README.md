# GameDive Backend API

This is the backend API for the GameDive application, a modern game store platform built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Role-based authorization (user/admin)
- CRUD operations for games
- User reviews and ratings
- Advanced filtering, sorting, and pagination
- File uploads
- API security best practices

## Prerequisites

- Node.js 14.x or higher
- MongoDB 4.4 or higher
- npm or yarn

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/game-dive.git
   cd game-dive/backend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up environment variables
   ```bash
   cp config/config.env.example config/config.env
   # Update the values in config/config.env
   ```

4. Start the development server
   ```bash
   # Run in development mode
   npm run dev
   
   # Run in production mode
   npm start
   ```

## API Documentation

### Authentication

| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| POST   | /api/v1/auth/register | Register a new user  |
| POST   | /api/v1/auth/login    | Login user           |
| GET    | /api/v1/auth/me       | Get current user     |
| PUT    | /api/v1/auth/updatedetails | Update user details |
| PUT    | /api/v1/auth/updatepassword | Update password    |
| GET    | /api/v1/auth/logout   | Logout user          |

### Games

| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| GET    | /api/v1/games      | Get all games        |
| GET    | /api/v1/games/:id  | Get single game      |
| POST   | /api/v1/games      | Create new game (Admin) |
| PUT    | /api/v1/games/:id  | Update game (Admin)  |
| DELETE | /api/v1/games/:id  | Delete game (Admin)  |
| POST   | /api/v1/games/:id/photo | Upload game photo (Admin) |

### Reviews

| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| GET    | /api/v1/reviews    | Get all reviews      |
| GET    | /api/v1/reviews/:id | Get single review   |
| POST   | /api/v1/games/:gameId/reviews | Add review |
| PUT    | /api/v1/reviews/:id | Update review       |
| DELETE | /api/v1/reviews/:id | Delete review       |

### Users (Admin only)

| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| GET    | /api/v1/users      | Get all users        |
| GET    | /api/v1/users/:id  | Get single user      |
| POST   | /api/v1/users      | Create new user      |
| PUT    | /api/v1/users/:id  | Update user          |
| DELETE | /api/v1/users/:id  | Delete user          |

## Environment Variables

Create a `.env` file in the root directory and add the following:

```
NODE_ENV=development
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
MAX_FILE_UPLOAD=1000000
FILE_UPLOAD_PATH=./public/uploads
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

1. Set up a MongoDB Atlas database or use a managed MongoDB service
2. Update the environment variables in your production environment
3. Build the application:
   ```bash
   npm run build
   ```
4. Start the production server:
   ```bash
   npm start
   ```

## Security

- All routes are protected by default
- Rate limiting is enabled (100 requests per 10 minutes)
- HTTP headers are set for security
- Data sanitization against NoSQL injection and XSS
- JWT stored in HTTP-only cookies
- Password hashing with bcrypt

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
