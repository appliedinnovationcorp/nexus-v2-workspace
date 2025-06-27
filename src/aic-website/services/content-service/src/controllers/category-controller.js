const { StatusCodes } = require('http-status-codes');
const Category = require('../models/category');
const Article = require('../models/article');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { publishContentEvent } = require('../events/content-events');

// Create a new category
const createCategory = async (req, res) => {
  // Only admin and editor can create categories
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    throw new ForbiddenError('Not authorized to create categories');
  }
  
  const category = await Category.create(req.body);
  
  // Publish category created event
  await publishContentEvent('category.created', {
    categoryId: category._id.toString(),
    name: category.name,
    slug: category.slug,
  });
  
  res.status(StatusCodes.CREATED).json({ category });
};

// Get all categories with filtering, sorting, and pagination
const getAllCategories = async (req, res) => {
  const { 
    parent, 
    showInNavigation,
    search, 
    sort, 
    page, 
    limit,
    fields,
  } = req.query;
  
  // Build query
  const queryObject = {};
  
  // Filter by parent
  if (parent) {
    queryObject.parent = parent === 'null' ? null : parent;
  }
  
  // Filter by showInNavigation
  if (showInNavigation) {
    queryObject.showInNavigation = showInNavigation === 'true';
  }
  
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
  let sortOptions = { order: 1, name: 1 };
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
  const categories = await Category.find(queryObject)
    .select(selectFields)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize)
    .populate('parent', 'name slug');
  
  // Get total count
  const totalCategories = await Category.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalCategories / pageSize);
  
  res.status(StatusCodes.OK).json({
    categories,
    count: categories.length,
    totalCategories,
    numOfPages,
    currentPage: pageNumber,
  });
};

// Get a single category by ID or slug
const getCategory = async (req, res) => {
  const { id } = req.params;
  
  let category;
  
  // Check if id is a valid ObjectId or a slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    // It's an ObjectId, find by ID
    category = await Category.findById(id)
      .populate('parent', 'name slug');
  } else {
    // It's a slug, find by slug
    category = await Category.findOne({ slug: id })
      .populate('parent', 'name slug');
  }
  
  if (!category) {
    throw new NotFoundError(`No category with id or slug: ${id}`);
  }
  
  res.status(StatusCodes.OK).json({ category });
};

// Update a category
const updateCategory = async (req, res) => {
  const { id } = req.params;
  
  // Only admin and editor can update categories
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    throw new ForbiddenError('Not authorized to update categories');
  }
  
  const category = await Category.findById(id);
  
  if (!category) {
    throw new NotFoundError(`No category with id: ${id}`);
  }
  
  // Update category
  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  ).populate('parent', 'name slug');
  
  // Publish category updated event
  await publishContentEvent('category.updated', {
    categoryId: updatedCategory._id.toString(),
    name: updatedCategory.name,
    slug: updatedCategory.slug,
  });
  
  res.status(StatusCodes.OK).json({ category: updatedCategory });
};

// Delete a category
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  
  // Only admin and editor can delete categories
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    throw new ForbiddenError('Not authorized to delete categories');
  }
  
  const category = await Category.findById(id);
  
  if (!category) {
    throw new NotFoundError(`No category with id: ${id}`);
  }
  
  // Check if category has children
  const hasChildren = await Category.exists({ parent: id });
  
  if (hasChildren) {
    throw new BadRequestError('Cannot delete category with child categories');
  }
  
  // Check if category is used in articles
  const isUsedInArticles = await Article.exists({ categories: id });
  
  if (isUsedInArticles) {
    throw new BadRequestError('Cannot delete category that is used in articles');
  }
  
  // Store category info for event before deletion
  const categoryInfo = {
    categoryId: category._id.toString(),
    name: category.name,
    slug: category.slug,
  };
  
  await category.deleteOne();
  
  // Publish category deleted event
  await publishContentEvent('category.deleted', categoryInfo);
  
  res.status(StatusCodes.OK).json({ msg: 'Category deleted successfully' });
};

// Get category tree
const getCategoryTree = async (req, res) => {
  // Get all categories
  const allCategories = await Category.find({})
    .select('name slug description parent order')
    .sort('order');
  
  // Build category tree
  const buildCategoryTree = (categories, parentId = null) => {
    return categories
      .filter(category => {
        if (parentId === null) {
          return category.parent === undefined || category.parent === null;
        }
        return category.parent && category.parent.toString() === parentId;
      })
      .map(category => ({
        id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        order: category.order,
        children: buildCategoryTree(categories, category._id.toString()),
      }))
      .sort((a, b) => a.order - b.order);
  };
  
  const categoryTree = buildCategoryTree(allCategories);
  
  res.status(StatusCodes.OK).json({ categoryTree });
};

// Get articles by category
const getArticlesByCategory = async (req, res) => {
  const { id } = req.params;
  const { page, limit, sort } = req.query;
  
  let category;
  
  // Check if id is a valid ObjectId or a slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    // It's an ObjectId, find by ID
    category = await Category.findById(id);
  } else {
    // It's a slug, find by slug
    category = await Category.findOne({ slug: id });
  }
  
  if (!category) {
    throw new NotFoundError(`No category with id or slug: ${id}`);
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
  
  // Find articles in this category
  const articles = await Article.find({
    categories: category._id,
    status: 'published',
  })
    .select('title slug description featuredImage publishedAt readTime')
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize)
    .populate('author', 'firstName lastName');
  
  // Get total count
  const totalArticles = await Article.countDocuments({
    categories: category._id,
    status: 'published',
  });
  
  const numOfPages = Math.ceil(totalArticles / pageSize);
  
  res.status(StatusCodes.OK).json({
    category,
    articles,
    count: articles.length,
    totalArticles,
    numOfPages,
    currentPage: pageNumber,
  });
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getArticlesByCategory,
};
