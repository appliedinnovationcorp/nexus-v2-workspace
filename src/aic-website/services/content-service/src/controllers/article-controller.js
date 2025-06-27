const { StatusCodes } = require('http-status-codes');
const Article = require('../models/article');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { publishContentEvent } = require('../events/content-events');
const { sanitizeHtml } = require('../utils/sanitize');

// Create a new article
const createArticle = async (req, res) => {
  // Sanitize HTML content
  if (req.body.content) {
    req.body.content = sanitizeHtml(req.body.content);
  }
  
  // Set author to current user
  req.body.author = req.user.userId;
  
  const article = await Article.create(req.body);
  
  // Publish article created event
  await publishContentEvent('article.created', {
    articleId: article._id.toString(),
    title: article.title,
    slug: article.slug,
    author: article.author.toString(),
    status: article.status,
  });
  
  res.status(StatusCodes.CREATED).json({ article });
};

// Get all articles with filtering, sorting, and pagination
const getAllArticles = async (req, res) => {
  const { 
    status, 
    author, 
    category,
    tag,
    featured,
    search, 
    sort, 
    page, 
    limit,
    fields,
  } = req.query;
  
  // Build query
  const queryObject = {};
  
  // Filter by status
  if (status) {
    queryObject.status = status;
  } else {
    // By default, only return published articles for non-admin users
    if (req.user.role !== 'admin' && req.user.role !== 'editor') {
      queryObject.status = 'published';
    }
  }
  
  // Filter by author
  if (author) {
    queryObject.author = author;
  }
  
  // Filter by category
  if (category) {
    queryObject.categories = category;
  }
  
  // Filter by tag
  if (tag) {
    queryObject.tags = tag;
  }
  
  // Filter by featured
  if (featured) {
    queryObject.featured = featured === 'true';
  }
  
  // Search by title, description, content
  if (search) {
    queryObject.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
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
  
  // Field selection
  let selectFields = '';
  if (fields) {
    selectFields = fields.split(',').join(' ');
  }
  
  // Execute query
  const articles = await Article.find(queryObject)
    .select(selectFields)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize)
    .populate('author', 'firstName lastName email')
    .populate('categories', 'name slug')
    .populate('tags', 'name slug');
  
  // Get total count
  const totalArticles = await Article.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalArticles / pageSize);
  
  res.status(StatusCodes.OK).json({
    articles,
    count: articles.length,
    totalArticles,
    numOfPages,
    currentPage: pageNumber,
  });
};

// Get a single article by ID or slug
const getArticle = async (req, res) => {
  const { id } = req.params;
  
  let article;
  
  // Check if id is a valid ObjectId or a slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    // It's an ObjectId, find by ID
    article = await Article.findById(id)
      .populate('author', 'firstName lastName email')
      .populate('categories', 'name slug')
      .populate('tags', 'name slug')
      .populate('relatedArticles', 'title slug description featuredImage');
  } else {
    // It's a slug, find by slug
    article = await Article.findOne({ slug: id })
      .populate('author', 'firstName lastName email')
      .populate('categories', 'name slug')
      .populate('tags', 'name slug')
      .populate('relatedArticles', 'title slug description featuredImage');
  }
  
  if (!article) {
    throw new NotFoundError(`No article with id or slug: ${id}`);
  }
  
  // Check if user can view this article
  if (article.status !== 'published' && 
      req.user.role !== 'admin' && 
      req.user.role !== 'editor' && 
      article.author._id.toString() !== req.user.userId) {
    throw new ForbiddenError('Not authorized to view this article');
  }
  
  // Increment view count
  article.views += 1;
  await article.save();
  
  res.status(StatusCodes.OK).json({ article });
};

// Update an article
const updateArticle = async (req, res) => {
  const { id } = req.params;
  
  // Sanitize HTML content
  if (req.body.content) {
    req.body.content = sanitizeHtml(req.body.content);
  }
  
  // Find article
  const article = await Article.findById(id);
  
  if (!article) {
    throw new NotFoundError(`No article with id: ${id}`);
  }
  
  // Check if user can update this article
  if (req.user.role !== 'admin' && 
      req.user.role !== 'editor' && 
      article.author.toString() !== req.user.userId) {
    throw new ForbiddenError('Not authorized to update this article');
  }
  
  // Update article
  const updatedArticle = await Article.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('author', 'firstName lastName email')
    .populate('categories', 'name slug')
    .populate('tags', 'name slug');
  
  // Publish article updated event
  await publishContentEvent('article.updated', {
    articleId: updatedArticle._id.toString(),
    title: updatedArticle.title,
    slug: updatedArticle.slug,
    status: updatedArticle.status,
  });
  
  res.status(StatusCodes.OK).json({ article: updatedArticle });
};

// Delete an article
const deleteArticle = async (req, res) => {
  const { id } = req.params;
  
  const article = await Article.findById(id);
  
  if (!article) {
    throw new NotFoundError(`No article with id: ${id}`);
  }
  
  // Check if user can delete this article
  if (req.user.role !== 'admin' && 
      req.user.role !== 'editor' && 
      article.author.toString() !== req.user.userId) {
    throw new ForbiddenError('Not authorized to delete this article');
  }
  
  // Store article info for event before deletion
  const articleInfo = {
    articleId: article._id.toString(),
    title: article.title,
    slug: article.slug,
    author: article.author.toString(),
  };
  
  await article.deleteOne();
  
  // Publish article deleted event
  await publishContentEvent('article.deleted', articleInfo);
  
  res.status(StatusCodes.OK).json({ msg: 'Article deleted successfully' });
};

// Add a comment to an article
const addComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  
  if (!content) {
    throw new BadRequestError('Comment content is required');
  }
  
  const article = await Article.findById(id);
  
  if (!article) {
    throw new NotFoundError(`No article with id: ${id}`);
  }
  
  // Add comment
  const comment = {
    user: req.user.userId,
    content,
    status: req.user.role === 'admin' || req.user.role === 'editor' ? 'approved' : 'pending',
  };
  
  article.comments.push(comment);
  await article.save();
  
  // Publish comment added event
  await publishContentEvent('article.comment-added', {
    articleId: article._id.toString(),
    title: article.title,
    slug: article.slug,
    commentId: article.comments[article.comments.length - 1]._id.toString(),
    userId: req.user.userId,
    status: comment.status,
  });
  
  res.status(StatusCodes.CREATED).json({ 
    comment: article.comments[article.comments.length - 1],
  });
};

// Update comment status
const updateCommentStatus = async (req, res) => {
  const { id, commentId } = req.params;
  const { status } = req.body;
  
  if (!status) {
    throw new BadRequestError('Status is required');
  }
  
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new BadRequestError('Invalid status');
  }
  
  // Only admin and editor can update comment status
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    throw new ForbiddenError('Not authorized to update comment status');
  }
  
  const article = await Article.findById(id);
  
  if (!article) {
    throw new NotFoundError(`No article with id: ${id}`);
  }
  
  // Find comment
  const comment = article.comments.id(commentId);
  
  if (!comment) {
    throw new NotFoundError(`No comment with id: ${commentId}`);
  }
  
  // Update comment status
  comment.status = status;
  await article.save();
  
  // Publish comment status updated event
  await publishContentEvent('article.comment-status-updated', {
    articleId: article._id.toString(),
    title: article.title,
    slug: article.slug,
    commentId: comment._id.toString(),
    userId: comment.user.toString(),
    status: comment.status,
  });
  
  res.status(StatusCodes.OK).json({ comment });
};

// Like an article
const likeArticle = async (req, res) => {
  const { id } = req.params;
  
  const article = await Article.findById(id);
  
  if (!article) {
    throw new NotFoundError(`No article with id: ${id}`);
  }
  
  // Increment like count
  article.likes += 1;
  await article.save();
  
  // Publish article liked event
  await publishContentEvent('article.liked', {
    articleId: article._id.toString(),
    title: article.title,
    slug: article.slug,
    userId: req.user.userId,
  });
  
  res.status(StatusCodes.OK).json({ 
    likes: article.likes,
  });
};

// Get related articles
const getRelatedArticles = async (req, res) => {
  const { id } = req.params;
  
  const article = await Article.findById(id);
  
  if (!article) {
    throw new NotFoundError(`No article with id: ${id}`);
  }
  
  // Find articles with same categories or tags
  const relatedArticles = await Article.find({
    _id: { $ne: id },
    status: 'published',
    $or: [
      { categories: { $in: article.categories } },
      { tags: { $in: article.tags } },
    ],
  })
    .select('title slug description featuredImage')
    .limit(3);
  
  res.status(StatusCodes.OK).json({ relatedArticles });
};

module.exports = {
  createArticle,
  getAllArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  addComment,
  updateCommentStatus,
  likeArticle,
  getRelatedArticles,
};
