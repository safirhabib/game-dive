const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a title for the review'],
    maxlength: 100
  },
  text: {
    type: String,
    required: [true, 'Please add some text']
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, 'Please add a rating between 1 and 10']
  },
  game: {
    type: mongoose.Schema.ObjectId,
    ref: 'Game',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent user from submitting more than one review per game
ReviewSchema.index({ game: 1, user: 1 }, { unique: true });

// Static method to get average rating and save
ReviewSchema.statics.getAverageRating = async function(gameId) {
  const obj = await this.aggregate([
    {
      $match: { game: gameId }
    },
    {
      $group: {
        _id: '$game',
        averageRating: { $avg: '$rating' },
        numOfReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Game').findByIdAndUpdate(gameId, {
      averageRating: obj[0] ? obj[0].averageRating.toFixed(1) : 0,
      numOfReviews: obj[0] ? obj[0].numOfReviews : 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.game);
});

// Call getAverageRating before remove
ReviewSchema.pre('remove', function() {
  this.constructor.getAverageRating(this.game);
});

module.exports = mongoose.model('Review', ReviewSchema);