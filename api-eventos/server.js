const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeDatabase } = require('./config/db');


const app = express();
app.use(cors());
app.use(express.json());

// Handler global para promesas no manejadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  if (reason && reason.stack) {
    console.error(reason.stack);
  }
});

// Handler global para excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  if (err && err.stack) {
    console.error(err.stack);
  }
  // process.exit(1); // Descomenta para que el server muera si querés
});

// Inicializar base de datos y luego iniciar servidor
const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Rutas base
    app.use('/api/user', require('./routes/userRoutes'));
    app.use('/api/event', require('./routes/eventRoutes'));
    app.use('/api/event-location', require('./routes/event-location.routes'));
    app.use('/api/tags', require('./routes/tagRoutes'));
    app.use('/api/provinces', require('./routes/provinceRoutes'));
    app.use('/api/locations', require('./routes/locationRoutes'));

    // Middleware de manejo de errores
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
      });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
  }
};

startServer();