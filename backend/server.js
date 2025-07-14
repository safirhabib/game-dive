const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const games = require('./src/data/games');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Game Schema (kept for reference, not used in runtime)
const gameSchema = {
  id: String,
  title: String,
  price: Number,
  originalPrice: Number,
  image: String,
  genre: String,
  platform: [String],
  rating: Number,
  description: String,
  features: [String],
  screenshots: [String],
  releaseDate: String,
  developer: String,
  publisher: String,
  isFeatured: Boolean,
  tags: [String]
};

// Routes
app.get('/api/games', (req, res) => {
  const { search, category, platform } = req.query;
  
  let filteredGames = [...games];
  
  if (search) {
    filteredGames = filteredGames.filter(game =>
      game.title.toLowerCase().includes(String(search).toLowerCase())
    );
  }
  
  if (category && category !== 'all') {
    filteredGames = filteredGames.filter(game =>
      game.genre.toLowerCase() === String(category).toLowerCase()
    );
  }
  
  if (platform && platform !== 'all') {
    filteredGames = filteredGames.filter(game =>
      game.platform.includes(String(platform))
    );
  }
  
  res.json(filteredGames);
});

app.get('/api/games/:id', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  if (game) {
    res.json(game);
  } else {
    res.status(404).json({ message: 'Game not found' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
