import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno ANTES de importar las rutas
dotenv.config();

// Importar rutas
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import pdfRoutes from './routes/pdf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (debe estar ANTES de las rutas de API)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured',
    webhook: process.env.N8N_WEBHOOK_URL ? 'configured' : 'not configured'
  });
});

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api/pdf', pdfRoutes);

// Servir archivos estáticos del cliente en producción
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));
  
  // Todas las rutas no-API sirven el index.html (para React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Dashboard AI - Apprecio`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
