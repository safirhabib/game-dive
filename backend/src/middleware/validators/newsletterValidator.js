const { body } = require('express-validator');

const subscribeNewsletterValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
];

module.exports = subscribeNewsletterValidator;
