const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { requireAuth } = require('../middlewares/auth.middleware'); // Middleware de admin
const { body, query, param } = require('express-validator');

// Validaciones
const createRoomValidation = [
  body('name')
    .notEmpty()
    .withMessage('Nombre de sala requerido')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nombre debe tener entre 3 y 100 caracteres')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('Nombre contiene caracteres no válidos'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descripción muy larga (máx. 500 caracteres)'),
  
  body('type')
    .optional()
    .isIn(['text', 'multimedia'])
    .withMessage('Tipo debe ser text o multimedia'),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Máximo de participantes debe estar entre 1 y 1000'),
  
  body('maxFileSize')
    .optional()
    .isInt({ min: 1024, max: 104857600 }) // 1KB a 100MB
    .withMessage('Tamaño máximo de archivo inválido'),
  
  body('allowedFileTypes')
    .optional()
    .isString()
    .withMessage('Tipos de archivo permitidos debe ser una cadena'),
  
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Fecha de expiración debe ser una fecha válida ISO 8601')
];

const updateRoomValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nombre debe tener entre 3 y 100 caracteres'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descripción muy larga'),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Máximo de participantes debe estar entre 1 y 1000'),
  
  body('maxFileSize')
    .optional()
    .isInt({ min: 1024, max: 104857600 })
    .withMessage('Tamaño máximo de archivo inválido')
];

const getRoomsValidation = [
  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('includeInactive debe ser boolean'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit debe estar entre 1 y 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser mayor o igual a 0')
];

const roomIdValidation = [
  param('id')
    .isUUID()
    .withMessage('ID de sala debe ser un UUID válido')
];

const pinValidation = [
  param('pin')
    .isNumeric()
    .withMessage('PIN debe ser numérico')
    .isLength({ min: 6, max: 6 })
    .withMessage('PIN debe tener exactamente 6 dígitos')
];

const filePermissionsValidation = [
  param('id')
    .isUUID()
    .withMessage('ID de sala debe ser un UUID válido'),
  
  query('fileSize')
    .isInt({ min: 1 })
    .withMessage('Tamaño de archivo debe ser un número positivo'),
  
  query('mimeType')
    .notEmpty()
    .withMessage('Tipo MIME requerido')
];

// RUTAS PÚBLICAS (para usuarios que quieren unirse)

// GET /api/rooms/pin/:pin - Obtener info de sala por PIN
router.get('/pin/:pin', pinValidation, roomController.getRoomByPin);

// RUTAS PROTEGIDAS (requieren autenticación de administrador)

// GET /api/rooms - Obtener salas del admin
router.get('/', requireAuth, getRoomsValidation, roomController.getRooms);

// GET /api/rooms/stats - Estadísticas generales
router.get('/stats', requireAuth, roomController.getStats);

// POST /api/rooms - Crear nueva sala
router.post('/', requireAuth, createRoomValidation, roomController.createRoom);

// POST /api/rooms/cleanup - Limpiar salas expiradas
router.post('/cleanup', requireAuth, roomController.cleanupExpiredRooms);

// GET /api/rooms/:id - Obtener sala específica
router.get('/:id', requireAuth, roomIdValidation, roomController.getRoomById);

// PUT /api/rooms/:id - Actualizar sala
router.put('/:id', requireAuth, roomIdValidation, updateRoomValidation, roomController.updateRoom);

// POST /api/rooms/:id/activate - Reactivar sala
router.post('/:id/activate', requireAuth, roomIdValidation, roomController.activateRoom);

// POST /api/rooms/:id/deactivate - Desactivar sala
router.post('/:id/desactivate', requireAuth, roomIdValidation, roomController.desactivateRoom);

// DELETE /api/rooms/:id - Eliminar sala permanentemente
router.delete('/:id', requireAuth, roomIdValidation, roomController.deleteRoom);

// GET /api/rooms/:id/participants - Participantes de la sala
router.get('/:id/participants', requireAuth, roomIdValidation, roomController.getRoomParticipants);

// GET /api/rooms/:id/file-permissions - Verificar permisos de archivo
router.get('/:id/file-permissions', requireAuth, filePermissionsValidation, roomController.checkFilePermissions);

module.exports = router;