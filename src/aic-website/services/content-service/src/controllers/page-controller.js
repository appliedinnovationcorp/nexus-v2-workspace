const { StatusCodes } = require('http-status-codes');
const Page = require('../models/page');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { publishContentEvent } = require('../events/content-events');
const { sanitizeHtml } = require('../utils/sanitize');

// Create a new page
const createPage = async (req, res) => {
  // Sanitize HTML content
  if (req.body.content) {
    req.body.content = sanitizeHtml(req.body.content);
  }
  
  // Set author to current user
  req.body.author = req.user.userId;
  
  const page = await Page.create(req.body);
  
  // Publish page created event
  await publishContentEvent('page.created', {
    pageId: page._id.toString(),
    title: page.title,
    slug: page.slug,
    author: page.author.toString(),
    status: page.status,
  });
  
  res.status(StatusCodes.CREATED).json({ page });
};

// Get all pages with filtering, sorting, and pagination
const getAllPages = async (req, res) => {
  const { 
    status, 
    author, 
    template,
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
  
  // Filter by status
  if (status) {
    queryObject.status = status;
  } else {
    // By default, only return published pages for non-admin users
    if (req.user.role !== 'admin' && req.user.role !== 'editor') {
      queryObject.status = 'published';
    }
  }
  
  // Filter by author
  if (author) {
    queryObject.author = author;
  }
  
  // Filter by template
  if (template) {
    queryObject.template = template;
  }
  
  // Filter by parent
  if (parent) {
    queryObject.parent = parent === 'null' ? null : parent;
  }
  
  // Filter by showInNavigation
  if (showInNavigation) {
    queryObject.showInNavigation = showInNavigation === 'true';
  }
  
  // Search by title, content
  if (search) {
    queryObject.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }
  
  // Pagination
  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;
  
  // Sorting
  let sortOptions = { order: 1, createdAt: -1 };
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
  const pages = await Page.find(queryObject)
    .select(selectFields)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize)
    .populate('author', 'firstName lastName email')
    .populate('parent', 'title slug');
  
  // Get total count
  const totalPages = await Page.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalPages / pageSize);
  
  res.status(StatusCodes.OK).json({
    pages,
    count: pages.length,
    totalPages,
    numOfPages,
    currentPage: pageNumber,
  });
};

// Get a single page by ID or slug
const getPage = async (req, res) => {
  const { id } = req.params;
  
  let page;
  
  // Check if id is a valid ObjectId or a slug
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    // It's an ObjectId, find by ID
    page = await Page.findById(id)
      .populate('author', 'firstName lastName email')
      .populate('parent', 'title slug');
  } else {
    // It's a slug, find by slug
    page = await Page.findOne({ slug: id })
      .populate('author', 'firstName lastName email')
      .populate('parent', 'title slug');
  }
  
  if (!page) {
    throw new NotFoundError(`No page with id or slug: ${id}`);
  }
  
  // Check if user can view this page
  if (page.status !== 'published' && 
      req.user.role !== 'admin' && 
      req.user.role !== 'editor' && 
      page.author._id.toString() !== req.user.userId) {
    throw new ForbiddenError('Not authorized to view this page');
  }
  
  res.status(StatusCodes.OK).json({ page });
};

// Update a page
const updatePage = async (req, res) => {
  const { id } = req.params;
  
  // Sanitize HTML content
  if (req.body.content) {
    req.body.content = sanitizeHtml(req.body.content);
  }
  
  // Find page
  const page = await Page.findById(id);
  
  if (!page) {
    throw new NotFoundError(`No page with id: ${id}`);
  }
  
  // Check if user can update this page
  if (req.user.role !== 'admin' && 
      req.user.role !== 'editor' && 
      page.author.toString() !== req.user.userId) {
    throw new ForbiddenError('Not authorized to update this page');
  }
  
  // Update page
  const updatedPage = await Page.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('author', 'firstName lastName email')
    .populate('parent', 'title slug');
  
  // Publish page updated event
  await publishContentEvent('page.updated', {
    pageId: updatedPage._id.toString(),
    title: updatedPage.title,
    slug: updatedPage.slug,
    status: updatedPage.status,
  });
  
  res.status(StatusCodes.OK).json({ page: updatedPage });
};

// Delete a page
const deletePage = async (req, res) => {
  const { id } = req.params;
  
  const page = await Page.findById(id);
  
  if (!page) {
    throw new NotFoundError(`No page with id: ${id}`);
  }
  
  // Check if user can delete this page
  if (req.user.role !== 'admin' && 
      req.user.role !== 'editor' && 
      page.author.toString() !== req.user.userId) {
    throw new ForbiddenError('Not authorized to delete this page');
  }
  
  // Check if page has children
  const hasChildren = await Page.exists({ parent: id });
  
  if (hasChildren) {
    throw new BadRequestError('Cannot delete page with child pages');
  }
  
  // Store page info for event before deletion
  const pageInfo = {
    pageId: page._id.toString(),
    title: page.title,
    slug: page.slug,
    author: page.author.toString(),
  };
  
  await page.deleteOne();
  
  // Publish page deleted event
  await publishContentEvent('page.deleted', pageInfo);
  
  res.status(StatusCodes.OK).json({ msg: 'Page deleted successfully' });
};

// Get navigation structure
const getNavigation = async (req, res) => {
  // Get all published pages that should be shown in navigation
  const navigationPages = await Page.find({
    status: 'published',
    showInNavigation: true,
  })
    .select('title slug navigationLabel parent order')
    .sort('order');
  
  // Build navigation tree
  const buildNavigationTree = (pages, parentId = null) => {
    return pages
      .filter(page => {
        if (parentId === null) {
          return page.parent === undefined || page.parent === null;
        }
        return page.parent && page.parent.toString() === parentId;
      })
      .map(page => ({
        id: page._id,
        title: page.navigationLabel || page.title,
        slug: page.slug,
        url: `/${page.slug}`,
        order: page.order,
        children: buildNavigationTree(pages, page._id.toString()),
      }))
      .sort((a, b) => a.order - b.order);
  };
  
  const navigation = buildNavigationTree(navigationPages);
  
  res.status(StatusCodes.OK).json({ navigation });
};

module.exports = {
  createPage,
  getAllPages,
  getPage,
  updatePage,
  deletePage,
  getNavigation,
};
