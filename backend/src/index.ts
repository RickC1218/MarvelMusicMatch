import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import playlistRoutes from './routes/playlistRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const username = process.env.USER ?? '';
const password = encodeURIComponent(process.env.PASSWORD ?? '');
const database = process.env.DATABASE ?? '';
const cluster = process.env.CLUSTER ?? '';
const port = process.env.PORT ?? '5000';

const MONGO_URI = `mongodb+srv://${username}:${password}@${database}.${cluster}.mongodb.net/?retryWrites=true&w=majority&appName=${database}`;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ Error al conectar a Mongo:', err));

app.get('/', (_req: Request, res: Response) => {
  res.send('🎶 ¡Servidor de MarvelMusicMatch funcionando!');
});

app.use('/api/playlists', playlistRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('💥 Error:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});