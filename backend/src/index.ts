import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';

import { collectConfigWarnings, env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import characterRoutes from './routes/characterRoutes';
import playlistRoutes from './routes/playlistRoutes';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: '100kb' }));

// Límite global: protege sobre todo el costo de OpenAI cuando se integre.
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Demasiadas peticiones. Intenta de nuevo en un minuto.',
      },
    },
  }),
);

app.get('/', (_req, res) => {
  res.send('🎶 ¡Servidor de MarvelMusicMatch funcionando!');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 });
});

app.use('/api/characters', characterRoutes);
app.use('/api/playlists', playlistRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const connectDatabase = async (): Promise<void> => {
  if (!env.mongoUri) {
    console.warn('⚠️  MongoDB no configurado: la persistencia está deshabilitada.');
    return;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error(
      '❌ Error al conectar a MongoDB:',
      error instanceof Error ? error.message : error,
    );
  }
};

const start = (): void => {
  for (const warning of collectConfigWarnings()) {
    console.warn(`⚠️  ${warning}`);
  }

  // El servidor HTTP escucha siempre, sin acoplar su disponibilidad a la BD.
  app.listen(env.port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${env.port}`);
  });

  void connectDatabase();
};

start();
