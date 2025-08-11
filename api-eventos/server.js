const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeDatabase } = require('./config/db');


const app = express();
app.use(cors());
app.use(express.json());

// Inicializar base de datos y luego iniciar servidor
const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Rutas base
    app.use('/api/user', require('./src/routes/userRoutes'));
    app.use('/api/event', require('./src/routes/eventRoutes'));
    app.use('/api/event-location', require('./src/routes/eventLocationRoutes'));
    app.use('/api/tags', require('./src/routes/tagRoutes'));
    app.use('/api/provinces', require('./src/routes/provinceRoutes'));
    app.use('/api/locations', require('./src/routes/locationRoutes'));

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