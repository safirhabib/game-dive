# Game Dive

A modern game store application built with React, Vite, and Node.js.

## Features

- Browse games by category and platform
- Search for games
- View game details
- Shopping cart functionality
- Responsive design

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- MongoDB (for production)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/game-dive.git
   cd game-dive
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Start the development servers**
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # In a new terminal, start frontend
   cd ..
   npm run dev
   ```

5. **Open the app**
   The frontend will be available at http://localhost:5173

## Testing

### Frontend Tests
```bash
# Run frontend tests
npm run test:frontend

# Run tests in watch mode
npm run test:frontend -- --watch
```

### Backend Tests
```bash
# Run backend tests
cd backend
npm test

# Run tests in watch mode
npm run test:watch
```

### Run All Tests
```bash
# From the root directory
npm test
```

## Building for Production

```bash
# Build frontend
npm run build

# Start production server (from backend directory)
cd backend
npm start
```

## Deployment

1. Set up a MongoDB database (e.g., MongoDB Atlas)
2. Update the `MONGODB_URI` in the backend's `.env` file
3. Build the frontend: `npm run build`
4. Deploy the backend to your preferred hosting service (e.g., Heroku, Render, etc.)

