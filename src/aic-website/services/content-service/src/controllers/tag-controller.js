const { StatusCodes } = require('http-status-codes');
const Tag = require('../models/tag');
const Article = require('../models/article');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { publishContentEvent } = require('../events/content-events');

// Create a new tag
const createTag = async (req, res) => {
  // Only admin and editor can create tags
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    throw new ForbiddenError('Not authorized to create tags');
  }
  
  const tag = await Tag.create(req.body);
  
  // Publish tag created event
  await publishContentEvent('tag.created', {
    tagId: tag._id.toString(),
    name: tag.name,
    slug: tag.slug,
  });
  
  res.status(StatusCodes.CREATED).json({ tag });
};

// Get all tags with filtering, sorting, and pagination
const getAllTags = async (req, res) => {
  const { 
    search, 
    sort, 
    page, 
    limit,
    fields,
  } = req.query;
  
  // Build query
  const queryObject = {};
  
  // Search by name, description
  if (search) {
    queryObject.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Pagination
  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;
  
  // Sorting
  let sortOptions = { name: 1 };
  if (sort) {
    const sortFields = sort.split(',').join(' ');
    sortOptions = sortFields;
  }
  
  // Field selection
  let selectFields = '';
  if (fields) {
    selectFields = fields.split(',').join(' ');
  }
  
  // Execute query
  const tags = await Tag.find(queryObject)
    .select(selectFields)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize);
  
  // Get total count
  const totalTags = await Tag.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalTags / pageSize);
  
  res.status(StatusCodes.OK).json({
    tags,
    count: tags.length,
    totalTags,
    numOfPages,
    currentPage: pageNumber,
  });
};

// Get a single tag by ID or slug
const getTag = async (req, res) => {
  const { id } = req.params;
  
  let tag;
  
  // Check if id is a valid ObjectId or a slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    // It's an ObjectId, find by ID
    tag = await Tag.findById(id);
  } else {
    // It's a slug, find by slug
    tag = await Tag.findOne({ slug: id });
  }
  
  if (!tag) {
    throw new NotFoundError(`No tag with id or slug: ${id}`);
  }
  
  res.status(StatusCodes.OK).json({ tag });
};

// Update a tag
const updateTag = async (req, res) => {
  const { id } = req.params;
  
  // Only admin and editor can update tags
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    throw new ForbiddenError('Not authorized to update tags');
  }
  
  const tag = await Tag.findById(id);
  
  if (!tag) {
    throw new NotFoundError(`No tag with id: ${id}`);
  }
  
  // Update tag
  const updatedTag = await Tag.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );
  
  // Publish tag updated event
  await publishContentEvent('tag.updated', {
    tagId: updatedTag._id.toString(),
    name: updatedTag.name,
    slug: updatedTag.slug,
  });
  
  res.status(StatusCodes.OK).json({ tag: updatedTag });
};

// Delete a tag
const deleteTag = async (req, res) => {
  const { id } = req.params;
  
  // Only admin and editor can delete tags
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    throw new ForbiddenError('Not authorized to delete tags');
  }
  
  const tag = await Tag.findById(id);
  
  if (!tag) {
    throw new NotFoundError(`No tag with id: ${id}`);
  }
  
  // Check if tag is used in articles
  const isUsedInArticles = await Article.exists({ tags: id });
  
  if (isUsedInArticles) {
    throw new BadRequestError('Cannot delete tag that is used in articles');
  }
  
  // Store tag info for event before deletion
  const tagInfo = {
    tagId: tag._id.toString(),
    name: tag.name,
    slug: tag.slug,
  };
  
  await tag.deleteOne();
  
  // Publish tag deleted event
  await publishContentEvent('tag.deleted', tagInfo);
  
  res.status(StatusCodes.OK).json({ msg: 'Tag deleted successfully' });
};

// Get articles by tag
const getArticlesByTag = async (req, res) => {
  const { id } = req.params;
  const { page, limit, sort } = req.query;
  
  let tag;
  
  // Check if id is a valid ObjectId or a slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    // It's an ObjectId, find by ID
    tag = await Tag.findById(id);
  } else {
    // It's a slug, find by slug
    tag = await Tag.findOne({ slug: id });
  }
  
  if (!tag) {
    throw new NotFoundError(`No tag with id or slug: ${id}`);
  }
  
  // Pagination
  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;
  
  // Sorting
  let sortOptions = { createdAt: -1 };
  if (sort) {
    const sortFields = sort.split(',').join(' ');
    sortOptions = sortFields;
  }
  
  // Find articles with this tag
  const articles = await Article.find({
    tags: tag._id,
    status: 'published',
  })
    .select('title slug description featuredImage publishedAt readTime')
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize)
    .populate('author', 'firstName lastName');
  
  // Get total count
  const totalArticles = await Article.countDocuments({
    tags: tag._id,
    status: 'published',
  });
  
  const numOfPages = Math.ceil(totalArticles / pageSize);
  
  res.status(StatusCodes.OK).json({
    tag,
    articles,
    count: articles.length,
    totalArticles,
    numOfPages,
    currentPage: pageNumber,
  });
};

// Get popular tags
const getPopularTags = async (req, res) => {
  const { limit = 10 } = req.query;
  
  // Aggregate to find most used tags
  const popularTags = await Article.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: Number(limit) },
  ]);
  
  // Get tag details
  const tagIds = popularTags.map(item => item._id);
  const tags = await Tag.find({ _id: { $in: tagIds } });
  
  // Combine count with tag details
  const result = tags.map(tag => {
    const tagWithCount = popularTags.find(item => item._id.toString() === tag._id.toString());
    return {
      _id: tag._id,
      name: tag.name,
      slug: tag.slug,
      count: tagWithCount ? tagWithCount.count : 0,
    };
  }).sort((a, b) => b.count - a.count);
  
  res.status(StatusCodes.OK).json({ tags: result });
};

module.exports = {
  createTag,
  getAllTags,
  getTag,
  updateTag,
  deleteTag,
  getArticlesByTag,
  getPopularTags,
};
