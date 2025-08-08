const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: 'Token inválido' });
    req.user = user;
    next();
  });
}; 

/*
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    // Manejar ambos formatos de token: "Bearer token" y solo "token"
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida',
      });
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7, authHeader.length)
      : authHeader;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

module.exports = { authenticate }; */