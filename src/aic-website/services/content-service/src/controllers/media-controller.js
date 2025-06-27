const { StatusCodes } = require('http-status-codes');
const Media = require('../models/media');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { publishContentEvent } = require('../events/content-events');
const { uploadToS3, deleteFromS3 } = require('../services/s3-service');
const { processImage } = require('../services/image-service');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const filetypes = /jpeg|jpg|png|gif|svg|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|webm|mp3|wav/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new BadRequestError('File type not supported'));
  },
}).single('file');

// Upload middleware
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'File too large. Maximum size is 10MB',
        });
      }
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message });
    } else if (err) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message });
    }
    next();
  });
};

// Upload media
const uploadMedia = async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('No file uploaded');
  }
  
  const { name, description, alt, caption, tags } = req.body;
  
  // Determine file type
  let type = 'other';
  if (req.file.mimetype.startsWith('image/')) {
    type = 'image';
  } else if (req.file.mimetype.startsWith('video/')) {
    type = 'video';
  } else if (req.file.mimetype.startsWith('audio/')) {
    type = 'audio';
  } else if (
    req.file.mimetype === 'application/pdf' ||
    req.file.mimetype.includes('word') ||
    req.file.mimetype.includes('excel') ||
    req.file.mimetype.includes('powerpoint')
  ) {
    type = 'document';
  }
  
  // Process image if it's an image
  let processedFile = req.file.buffer;
  let width, height, thumbnailBuffer;
  
  if (type === 'image') {
    try {
      const processed = await processImage(req.file.buffer);
      processedFile = processed.buffer;
      width = processed.width;
      height = processed.height;
      thumbnailBuffer = processed.thumbnailBuffer;
    } catch (error) {
      throw new BadRequestError(`Error processing image: ${error.message}`);
    }
  }
  
  // Generate unique key for S3
  const fileExt = path.extname(req.file.originalname);
  const fileName = `${uuidv4()}${fileExt}`;
  const key = `uploads/${type}s/${fileName}`;
  
  // Upload to S3
  const uploadResult = await uploadToS3(processedFile, key, req.file.mimetype);
  
  // Upload thumbnail if available
  let thumbnailUrl;
  if (thumbnailBuffer) {
    const thumbnailKey = `uploads/${type}s/thumbnails/${fileName}`;
    const thumbnailResult = await uploadToS3(thumbnailBuffer, thumbnailKey, req.file.mimetype);
    thumbnailUrl = thumbnailResult.Location;
  }
  
  // Create media record
  const media = await Media.create({
    name: name || req.file.originalname,
    description,
    type,
    mimeType: req.file.mimetype,
    url: uploadResult.Location,
    key,
    size: req.file.size,
    width,
    height,
    thumbnailUrl,
    alt,
    caption,
    uploadedBy: req.user.userId,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
  });
  
  // Publish media uploaded event
  await publishContentEvent('media.uploaded', {
    mediaId: media._id.toString(),
    name: media.name,
    type: media.type,
    url: media.url,
    uploadedBy: media.uploadedBy.toString(),
  });
  
  res.status(StatusCodes.CREATED).json({ media });
};

// Get all media with filtering, sorting, and pagination
const getAllMedia = async (req, res) => {
  const { 
    type, 
    uploadedBy, 
    search, 
    tags,
    sort, 
    page, 
    limit,
    fields,
  } = req.query;
  
  // Build query
  const queryObject = {};
  
  // Filter by type
  if (type) {
    queryObject.type = type;
  }
  
  // Filter by uploadedBy
  if (uploadedBy) {
    queryObject.uploadedBy = uploadedBy;
  }
  
  // Filter by tags
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    queryObject.tags = { $in: tagArray };
  }
  
  // Search by name, description, alt, caption
  if (search) {
    queryObject.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { alt: { $regex: search, $options: 'i' } },
      { caption: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
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
  const media = await Media.find(queryObject)
    .select(selectFields)
    .sort(sortOptions)
    .skip(skip)
    .limit(pageSize)
    .populate('uploadedBy', 'firstName lastName email');
  
  // Get total count
  const totalMedia = await Media.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalMedia / pageSize);
  
  res.status(StatusCodes.OK).json({
    media,
    count: media.length,
    totalMedia,
    numOfPages,
    currentPage: pageNumber,
  });
};

// Get a single media item
const getMedia = async (req, res) => {
  const { id } = req.params;
  
  const media = await Media.findById(id)
    .populate('uploadedBy', 'firstName lastName email');
  
  if (!media) {
    throw new NotFoundError(`No media with id: ${id}`);
  }
  
  res.status(StatusCodes.OK).json({ media });
};

// Update media metadata
const updateMedia = async (req, res) => {
  const { id } = req.params;
  const { name, description, alt, caption, tags } = req.body;
  
  const media = await Media.findById(id);
  
  if (!media) {
    throw new NotFoundError(`No media with id: ${id}`);
  }
  
  // Check if user can update this media
  if (req.user.role !== 'admin' && 
      req.user.role !== 'editor' && 
      media.uploadedBy.toString() !== req.user.userId) {
    throw new ForbiddenError('Not authorized to update this media');
  }
  
  // Update fields
  if (name) media.name = name;
  if (description !== undefined) media.description = description;
  if (alt !== undefined) media.alt = alt;
  if (caption !== undefined) media.caption = caption;
  if (tags) media.tags = tags.split(',').map(tag => tag.trim());
  
  await media.save();
  
  // Publish media updated event
  await publishContentEvent('media.updated', {
    mediaId: media._id.toString(),
    name: media.name,
    type: media.type,
    url: media.url,
  });
  
  res.status(StatusCodes.OK).json({ media });
};

// Delete media
const deleteMedia = async (req, res) => {
  const { id } = req.params;
  
  const media = await Media.findById(id);
  
  if (!media) {
    throw new NotFoundError(`No media with id: ${id}`);
  }
  
  // Check if user can delete this media
  if (req.user.role !== 'admin' && 
      req.user.role !== 'editor' && 
      media.uploadedBy.toString() !== req.user.userId) {
    throw new ForbiddenError('Not authorized to delete this media');
  }
  
  // Store media info for event before deletion
  const mediaInfo = {
    mediaId: media._id.toString(),
    name: media.name,
    type: media.type,
    url: media.url,
  };
  
  // Delete from S3
  try {
    await deleteFromS3(media.key);
    
    // Delete thumbnail if exists
    if (media.thumbnailUrl) {
      const thumbnailKey = media.key.replace('uploads/', 'uploads/thumbnails/');
      await deleteFromS3(thumbnailKey);
    }
  } catch (error) {
    // Log error but continue with deletion from database
    console.error(`Error deleting from S3: ${error.message}`);
  }
  
  await media.deleteOne();
  
  // Publish media deleted event
  await publishContentEvent('media.deleted', mediaInfo);
  
  res.status(StatusCodes.OK).json({ msg: 'Media deleted successfully' });
};

module.exports = {
  uploadMiddleware,
  uploadMedia,
  getAllMedia,
  getMedia,
  updateMedia,
  deleteMedia,
};
