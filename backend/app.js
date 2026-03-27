import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// All routes under /api
app.use('/api', routes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
