import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'
import { swaggerUi, swaggerSpec } from './config/swagger.js';
import levelsRouter from './routes/levels.js';
import playersRouter from './routes/players.js'
import usersRouter from './routes/users.js'
import recordsRouter from './routes/records.js'
import claimsRouter from './routes/claims.js'

dotenv.config();

const app = express();
const port = 3000;

app.use(cors({
  origin: [process.env.VITE_FRONTEND_URL, 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Routes
app.use('/levels', levelsRouter);
app.use('/players', playersRouter);
app.use('/users', usersRouter);
app.use('/records', recordsRouter);
app.use('/claims', claimsRouter);

app.listen(port, () => {
	console.log(`Server has started on http://localhost:${port}`);
  console.log(`API docs at http://localhost:${port}/api-docs`);
});
