// Ejemplo de configuración - Crear archivo .env con estas variables
module.exports = {
  // Configuración de la base de datos
  DATABASE_URL: 'postgresql://usuario:password@localhost:5432/eventos_db',
  
  // Configuración JWT
  JWT_SECRET: 'tu_secreto_jwt_super_seguro_aqui',
  
  // Puerto del servidor
  PORT: 3000
}; 