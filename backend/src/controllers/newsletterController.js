const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { validationResult } = require('express-validator');

const subscribeToNewsletter = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if email already exists
    const existingSubscriber = await NewsletterSubscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ 
        success: false,
        message: 'This email is already subscribed to our newsletter.'
      });
    }

    // Create new subscriber
    const subscriber = new NewsletterSubscriber({
      email,
      isActive: true
    });

    await subscriber.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing to our newsletter!',
      data: {
        email: subscriber.email,
        subscribedAt: subscriber.subscribedAt
      }
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to newsletter. Please try again later.'
    });
  }
};

const unsubscribeFromNewsletter = async (req, res) => {
  try {
    const { email } = req.params;
    
    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { isActive: false },
      { new: true }
    );

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found.'
      });
    }

    res.json({
      success: true,
      message: 'You have been unsubscribed from our newsletter.'
    });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe. Please try again later.'
    });
  }
};

module.exports = {
  subscribeToNewsletter,
  unsubscribeFromNewsletter
};

