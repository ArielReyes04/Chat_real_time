const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller'); // ✅ IMPORTAR CONTROLADOR CORRECTO
const { requireUserAuth } = require('../middlewares/user.middleware');
const { body, query, param } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configuración de multer para archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/files/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
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
    .withMessage('ID de sala requerido')
    .isUUID()
    .withMessage('ID de sala debe ser un UUID válido'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit debe ser entre 1 y 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser mayor o igual a 0')
];

const postMessageValidation = [
  body('roomId')
    .notEmpty()
    .withMessage('ID de sala requerido')
    .isUUID()
    .withMessage('ID de sala debe ser un UUID válido'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('El contenido debe tener entre 1 y 2000 caracteres'),
  body('type')
    .optional()
    .isIn(['text', 'file'])
    .withMessage('Tipo debe ser text o file')
];

const searchValidation = [
  query('roomId')
    .notEmpty()
    .withMessage('ID de sala requerido')
    .isUUID()
    .withMessage('ID de sala debe ser un UUID válido'),
  query('q')
    .notEmpty()
    .withMessage('Término de búsqueda requerido')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Término de búsqueda debe tener entre 2 y 100 caracteres')
];

const deleteMessageValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de mensaje debe ser un número válido')
];

const getFilesValidation = [
  query('roomId')
    .notEmpty()
    .withMessage('ID de sala requerido')
    .isUUID()
    .withMessage('ID de sala debe ser un UUID válido')
];

// RUTAS

// GET /api/messages - Obtener mensajes de una sala
router.get('/', requireUserAuth, getMessagesValidation, messageController.getMessages);

// GET /api/messages/search - Buscar mensajes (ANTES que /:id)
router.get('/search', requireUserAuth, searchValidation, messageController.searchMessages);

// GET /api/messages/files - Obtener archivos de una sala (ANTES que /:id)
router.get('/files', requireUserAuth, getFilesValidation, messageController.getRoomFiles);

// POST /api/messages - Enviar mensaje de texto
router.post('/', requireUserAuth, postMessageValidation, messageController.postMessage);

// POST /api/messages/file - Enviar archivo
router.post('/file', 
  requireUserAuth,
  upload.single('file'),
  [
    body('roomId').notEmpty().isUUID().withMessage('ID de sala requerido'),
    body('content').optional().trim().isLength({ max: 500 }).withMessage('Descripción muy larga')
  ],
  (req, res, next) => {
    // Validar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Archivo requerido'
      });
    }
    // Establecer tipo como 'file'
    req.body.type = 'file';
    next();
  },
  messageController.postMessage
);

// DELETE /api/messages/:id - Eliminar mensaje
router.delete('/:id', requireUserAuth, deleteMessageValidation, messageController.deleteMessage);

module.exports = router;