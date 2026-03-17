const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  fullDescription: {
    type: String,
    maxlength: [20000, 'Full description cannot be more than 20000 characters']
  },
  price: {
    currentInBdt: {
      type: Number,
      required: [true, 'Please add a price in BDT'],
      min: [0, 'Price must be a positive number']
    },
    originalInBdt: {
      type: Number,
      min: [0, 'Original price must be a positive number']
    },
    currentInCAD: {
      type: Number,
      required: [true, 'Please add a price in CAD'],
      min: [0, 'Price must be a positive number']
    },
    originalInCAD: {
      type: Number,
      min: [0, 'Original price must be a positive number']
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot be more than 100%']
    },
    currency: {
      type: String,
      default: 'BDT',
      enum: ['BDT', 'USD', 'CAD', 'EUR', 'GBP']
    }
  },
  categories: [{
    type: String,
    required: [true, 'Please add at least one category']
  }],
  relevantCategories: [{
    type: String
  }],
  platform: {
    type: String,
    required: [true, 'Please specify the platform'],
    enum: [
      'PC',
      'PlayStation 5',
      'Xbox Series X|S',
      'Nintendo Switch',
      'PlayStation 4',
      'Xbox One',
      'Mobile',
      'Other'
    ]
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  developer: {
    type: String,
    required: [true, 'Please add a developer']
  },
  publisher: {
    type: String,
    required: [true, 'Please add a publisher']
  },
  imageUrl: {
    type: String,
    required: [true, 'Please add an image URL'],
    default: 'https://via.placeholder.com/300x400?text=No+Image+Available',
    validate: {
      validator: function(v) {
        // Allow empty strings or valid URLs
        if (!v) return true;
        try {
          new URL(v);
          return true;
        } catch (e) {
          return false;
        }
      },
      message: props => `${props.value} is not a valid URL`
    }
  },
  screenshots: [{
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        try {
          new URL(v);
          return true;
        } catch (e) {
          return false;
        }
      },
      message: props => `${props.value} is not a valid URL`
    }
  }],
  screenshots: [String],
  tags: [String],
  orderRanks: {
    default: { type: Number },
    popularity: { type: Number },
    priceLowToHigh: { type: Number },
    priceHighToLow: { type: Number }
  },
  isInStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock quantity cannot be negative']
  },
  averageRating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  features: [String],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  saleEnds: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create game slug from the name and set price fields
GameSchema.pre('save', function(next) {
  // Create slug
  this.slug = this.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  
  // Set isOnSale based on discount
  if (this.price.discount > 0) {
    this.isOnSale = true;
  }
  
  // Set updatedAt timestamp
  this.updatedAt = Date.now();
  
  next();
});

// Cascade delete reviews when a game is deleted
GameSchema.pre('remove', async function(next) {
  await this.model('Review').deleteMany({ game: this._id });
  next();
});

// Reverse populate with virtuals
GameSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'game',
  justOne: false
});

// Calculate average rating
GameSchema.statics.getAverageRating = async function(gameId) {
  const obj = await this.aggregate([
    {
      $match: { _id: gameId }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'game',
        as: 'reviews'
      }
    },
    {
      $addFields: {
        averageRating: { $avg: '$reviews.rating' },
        numOfReviews: { $size: '$reviews' }
      }
    },
    {
      $project: {
        averageRating: 1,
        numOfReviews: 1
      }
    }
  ]);

  try {
    await this.model('Game').findByIdAndUpdate(gameId, {
      averageRating: obj[0]?.averageRating?.toFixed(1) || 0,
      numOfReviews: obj[0]?.numOfReviews || 0
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = mongoose.model('Game', GameSchema);
