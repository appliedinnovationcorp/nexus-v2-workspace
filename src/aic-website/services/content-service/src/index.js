require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const { setupKafka } = require('./events/kafka');
const { errorHandler } = require('./middleware/error-handler');
const { notFound } = require('./middleware/not-found');
const { logger } = require('./utils/logger');
const articleRoutes = require('./routes/article-routes');
const pageRoutes = require('./routes/page-routes');
const mediaRoutes = require('./routes/media-routes');
const categoryRoutes = require('./routes/category-routes');
const tagRoutes = require('./routes/tag-routes');
const healthRoutes = require('./routes/health-routes');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/pages', pageRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/tags', tagRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 3002;

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Setup Kafka producer/consumer
    await setupKafka();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Content service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
