/**
 * Memory / Archive Item Controller for AI Personal Archive
 * Week 3: Production Backend Finalization with MongoDB Atlas & Mongoose
 */

const mongoose = require('mongoose');
const Memory = require('../models/Memory');

/**
 * @desc    Create a new memory / archive item
 * @route   POST /api/memories
 * @access  Private (Protected by JWT)
 */
const createMemory = async (req, res, next) => {
  try {
    const { title, content, description, type, category, tags, importance, isFavorite } = req.body;

    // 1. Validate required fields
    if (!title || (typeof title === 'string' && title.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a memory title'
      });
    }

    const memoryContent = content || description;
    if (!memoryContent || (typeof memoryContent === 'string' && memoryContent.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide memory content'
      });
    }

    // 2. Format tags if provided as string or array
    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string' && tags.trim() !== '') {
      parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // 3. Create Memory document associated with authenticated user
    const memory = await Memory.create({
      title: title.trim(),
      content: memoryContent.trim(),
      type: type || 'memory',
      category: category ? category.trim() : 'General',
      tags: parsedTags,
      importance: importance ? Number(importance) : 3,
      isFavorite: Boolean(isFavorite),
      user: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Memory created successfully',
      data: memory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all memories for the authenticated user
 * @route   GET /api/memories
 * @access  Private (Protected by JWT)
 */
const getAllMemories = async (req, res, next) => {
  try {
    const { type, category, tag, search, all } = req.query;

    // Query builder: default to current authenticated user's records
    const query = {};

    // Allow admins to view all records if requested with ?all=true
    if (req.user.role === 'admin' && all === 'true') {
      // no user filter
    } else {
      query.user = req.user._id;
    }

    // Filter by type
    if (type && type.trim() !== '') {
      query.type = type.trim();
    }

    // Filter by category
    if (category && category.trim() !== '') {
      query.category = new RegExp(category.trim(), 'i');
    }

    // Filter by tag
    if (tag && tag.trim() !== '') {
      query.tags = tag.trim();
    }

    // Search in title and content
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { content: searchRegex }];
    }

    const memories = await Memory.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: memories.length,
      data: memories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single memory by ID
 * @route   GET /api/memories/:id
 * @access  Private (Protected by JWT)
 */
const getMemoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid memory ID format: ${id}`
      });
    }

    const memory = await Memory.findById(id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: `Memory not found with id ${id}`
      });
    }

    // Verify ownership or admin privilege
    if (memory.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Not authorized to access this memory'
      });
    }

    return res.status(200).json({
      success: true,
      data: memory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update memory by ID
 * @route   PUT /api/memories/:id
 * @access  Private (Protected by JWT)
 */
const updateMemory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, description, type, category, tags, importance, isFavorite } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid memory ID format: ${id}`
      });
    }

    const memory = await Memory.findById(id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: `Memory not found with id ${id}`
      });
    }

    // Verify ownership or admin privilege
    if (memory.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Not authorized to update this memory'
      });
    }

    // Prepare fields to update
    const updates = {};
    if (title !== undefined) updates.title = String(title).trim();
    if (content !== undefined) updates.content = String(content).trim();
    if (description !== undefined && content === undefined) updates.content = String(description).trim();
    if (type !== undefined) updates.type = type;
    if (category !== undefined) updates.category = String(category).trim();
    if (importance !== undefined) updates.importance = Number(importance);
    if (isFavorite !== undefined) updates.isFavorite = Boolean(isFavorite);

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        updates.tags = tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        updates.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const updatedMemory = await Memory.findByIdAndUpdate(id, updates, {
      returnDocument: 'after',
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Memory updated successfully',
      data: updatedMemory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete memory by ID
 * @route   DELETE /api/memories/:id
 * @access  Private (Protected by JWT)
 */
const deleteMemory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid memory ID format: ${id}`
      });
    }

    const memory = await Memory.findById(id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: `Memory not found with id ${id}`
      });
    }

    // Verify ownership or admin privilege
    if (memory.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Not authorized to delete this memory'
      });
    }

    await Memory.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Memory deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMemory,
  getAllMemories,
  getMemoryById,
  updateMemory,
  deleteMemory
};

