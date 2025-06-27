require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const { setupKafka } = require('./events/kafka');
const { setupRedis } = require('./config/redis');
const { errorHandler } = require('./middleware/error-handler');
const { notFound } = require('./middleware/not-found');
const { logger } = require('./utils/logger');
const { loadModels } = require('./ml/model-loader');
const nlpRoutes = require('./routes/nlp-routes');
const visionRoutes = require('./routes/vision-routes');
const recommendationRoutes = require('./routes/recommendation-routes');
const chatbotRoutes = require('./routes/chatbot-routes');
const analyzeRoutes = require('./routes/analyze-routes');
const healthRoutes = require('./routes/health-routes');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
app.use('/api/v1/nlp', nlpRoutes);
app.use('/api/v1/vision', visionRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/analyze', analyzeRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 3003;

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Setup Redis
    await setupRedis();
    
    // Setup Kafka producer/consumer
    await setupKafka();
    
    // Load ML models
    await loadModels();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`AI Engine service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
