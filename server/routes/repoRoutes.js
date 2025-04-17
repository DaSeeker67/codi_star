// server/routes/repoRoutes.js
import express from 'express';
import * as repoController from '../controller/repoController.js';
import LangChainService from '../services/Langchainservice.js';

const router = express.Router();

// Middleware to ensure LangChain is initialized
const ensureLangChainInitialized = async (req, res, next) => {
  try {
    if (!LangChainService.index) {
      // Initialize LangChain if not already initialized
      await LangChainService.initialize();
    }
    next();
  } catch (error) {
    console.error('Error initializing LangChain:', error);
    res.status(500).json({ error: 'Failed to initialize LangChain service' });
  }
};

// Apply the middleware to all routes
router.use(ensureLangChainInitialized);

// Process repository endpoint
router.post('/process', repoController.processRepository);

// Query repository endpoint
router.post('/query', repoController.queryRepository);

export default router;