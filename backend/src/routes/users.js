const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserReviews
} = require('../controllers/users');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below this middleware will be protected
router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(getUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

// Route to get reviews by user
router.get('/:id/reviews', getUserReviews);

module.exports = router;