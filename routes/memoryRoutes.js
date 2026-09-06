const express = require('express');
const router = express.Router();
const {
  createMemory,
  getAllMemories,
  getMemoryById,
  updateMemory,
  deleteMemory
} = require('../controllers/memoryController');
const { protect } = require('../middleware/authMiddleware');

// Protect all Memory CRUD endpoints - Requires valid JWT authentication
router.use(protect);

// Memory CRUD Routes
router.route('/')
  .post(createMemory)
  .get(getAllMemories);

router.route('/:id')
  .get(getMemoryById)
  .put(updateMemory)
  .delete(deleteMemory);

module.exports = router;

