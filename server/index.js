import dotenv from 'dotenv';
import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";
import serverless from 'serverless-http'; 
import repoRoutes from './routes/repoRoutes.js';
import LangChainService from './services/Langchainservice.js';

dotenv.config(); // Also remember to initialize dotenv

const app = express();

app.use(cors({
  origin: ['http://localhost:5174', '*', 'http://localhost:5173', 'https://hrify-frontend-plum.vercel.app', 'https://hrify-frontend-crvwhg7b2-ayushman075s-projects.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "5mb"
}));
app.use(express.static("public"));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Cookies:', req.cookies);
  next();
});

app.use('/api/repo', repoRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to Codi, on this line you are talking to Codi server !!');
});

const port = process.env.PORT || 3005;

app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);

  try {
    await LangChainService.initialize();
    console.log('LangChain service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize LangChain service:', error);
  }
});

// ✅ ESM export for serverless environments
export const handler = serverless(app);
