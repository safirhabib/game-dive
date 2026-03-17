const express = require('express');
const { 
  subscribeToNewsletter, 
  unsubscribeFromNewsletter 
} = require('../controllers/newsletterController');
const subscribeNewsletterValidator = require('../middleware/validators/newsletterValidator');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Subscribe to newsletter
router.post(
  '/subscribe',
  [
    // Apply validation middleware
    ...subscribeNewsletterValidator,
    // Then validate the request
    validateRequest,
    // Finally, call the controller
    subscribeToNewsletter
  ]
);

// Unsubscribe from newsletter
router.post('/unsubscribe/:email', unsubscribeFromNewsletter);

module.exports = router;
