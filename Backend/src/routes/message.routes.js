const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { requireUserAuth } = require('../middlewares/user.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');
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

// RUTAS EXISTENTES (usuarios)
router.get('/', requireUserAuth, getMessagesValidation, messageController.getMessages);
router.get('/search', requireUserAuth, searchValidation, messageController.searchMessages);
router.get('/files', requireUserAuth, getFilesValidation, messageController.getRoomFiles);
router.post('/', requireUserAuth, postMessageValidation, messageController.postMessage);
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
router.delete('/:id', requireUserAuth, deleteMessageValidation, messageController.deleteMessage);

// === RUTAS PARA ADMIN (nuevas) ===
// Listar salas del admin (usa token admin)
router.get('/rooms', requireAuth, messageController.getRoomsForAdmin);

// Crear sala
router.post(
  '/rooms',
  requireAuth,
  [
    body('name').notEmpty().withMessage('Nombre requerido'),
    body('room_type').isIn(['private', 'group']).withMessage('Tipo inválido')
  ],
  messageController.createRoom
);

// Obtener mensajes por sala (ID numérico)
router.get(
  '/room/:roomId',
  requireAuth,
  [param('roomId').isInt({ min: 1 }).withMessage('roomId debe ser numérico')],
  messageController.getMessagesForAdmin
);

// Enviar mensaje (admin)
router.post(
  '/send',
  requireAuth,
  [
    body('room_id').isInt({ min: 1 }).withMessage('room_id requerido'),
    body('content').isString().isLength({ min: 1, max: 2000 }).withMessage('Contenido inválido')
  ],
  messageController.sendMessageForAdmin
);

module.exports = router;