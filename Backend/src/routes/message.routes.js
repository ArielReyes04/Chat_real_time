const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { requireUserAuth } = require('../middlewares/user.middleware');
const { body, query, param } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configuración de multer para archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/files');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Validaciones
const getMessagesValidation = [
  query('roomId')
    .notEmpty()
    .withMessage('Room ID es requerido')
    .isUUID()
    .withMessage('Room ID debe ser un UUID válido'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit debe estar entre 1 y 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser mayor o igual a 0')
];

const postMessageValidation = [
  body('roomId')
    .notEmpty()
    .withMessage('Room ID es requerido')
    .isUUID()
    .withMessage('Room ID debe ser un UUID válido'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Contenido debe tener entre 1 y 2000 caracteres'),
  
  body('type')
    .optional()
    .isIn(['text', 'file'])
    .withMessage('Tipo debe ser text o file')
];

const searchMessagesValidation = [
  query('roomId')
    .notEmpty()
    .withMessage('Room ID es requerido')
    .isUUID()
    .withMessage('Room ID debe ser un UUID válido'),
  
  query('q')
    .notEmpty()
    .withMessage('Término de búsqueda es requerido')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Término de búsqueda debe tener entre 1 y 100 caracteres'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit debe estar entre 1 y 50'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser mayor o igual a 0')
];

const getRoomFilesValidation = [
  query('roomId')
    .notEmpty()
    .withMessage('Room ID es requerido')
    .isUUID()
    .withMessage('Room ID debe ser un UUID válido'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit debe estar entre 1 y 50')
];

const deleteMessageValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de mensaje debe ser un número entero positivo')
];

// RUTAS

// GET /api/messages - Obtener mensajes de una sala
router.get('/', 
  requireUserAuth, 
  getMessagesValidation, 
  messageController.getMessages
);

// POST /api/messages - Enviar mensaje de texto
router.post('/', 
  requireUserAuth, 
  postMessageValidation, 
  messageController.postMessage
);

// POST /api/messages/file - Enviar archivo
router.post('/file', 
  requireUserAuth,
  upload.single('file'),
  [
    body('roomId')
      .notEmpty()
      .withMessage('Room ID es requerido')
      .isUUID()
      .withMessage('Room ID debe ser un UUID válido'),
    
    body('content')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Descripción muy larga (máx. 500 caracteres)')
  ],
  messageController.postMessage
);

// GET /api/messages/search - Buscar mensajes
router.get('/search', 
  requireUserAuth, 
  searchMessagesValidation, 
  messageController.searchMessages
);

// GET /api/messages/files - Obtener archivos de una sala
router.get('/files', 
  requireUserAuth, 
  getRoomFilesValidation, 
  messageController.getRoomFiles
);

// DELETE /api/messages/:id - Eliminar mensaje
router.delete('/:id', 
  requireUserAuth, 
  deleteMessageValidation, 
  messageController.deleteMessage
);

// Manejo de errores de Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Archivo demasiado grande (máx. 10MB)'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo inesperado'
      });
    }
  }
  
  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(415).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;