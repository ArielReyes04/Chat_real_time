const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireUserAuth } = require('../middlewares/user.middleware');
const { body, query, param } = require('express-validator');

// Validaciones
const joinRoomValidation = [
  body('pin')
    .notEmpty()
    .withMessage('PIN es requerido')
    .isLength({ min: 4, max: 10 })
    .withMessage('PIN debe tener entre 4 y 10 caracteres')
    .isAlphanumeric()
    .withMessage('PIN debe contener solo letras y números'),
  
  body('nickname')
    .notEmpty()
    .withMessage('Nickname es requerido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nickname debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/)
    .withMessage('Nickname contiene caracteres no válidos')
];

const roomParticipantsValidation = [
  param('roomId')
    .isUUID()
    .withMessage('Room ID debe ser un UUID válido')
];

const checkPinValidation = [
  query('pin')
    .notEmpty()
    .withMessage('PIN es requerido')
    .isAlphanumeric()
    .withMessage('PIN debe contener solo letras y números')
];

// RUTAS PÚBLICAS (sin autenticación)

// POST /api/users/join - Unirse a una sala
router.post('/join', joinRoomValidation, userController.joinRoom);

// GET /api/users/rooms/check - Verificar PIN sin unirse
router.get('/rooms/check', checkPinValidation, userController.checkPin);

// GET /api/users/session/validate - Validar sesión
router.get('/session/validate', userController.validateSession);

// RUTAS PROTEGIDAS (requieren sessionId)

// GET /api/users/profile - Obtener perfil
router.get('/profile', requireUserAuth, userController.getProfile);

// POST /api/users/leave - Salir de sala
router.post('/leave', requireUserAuth, userController.leaveRoom);

// PUT /api/users/activity - Actualizar actividad (heartbeat)
router.put('/activity', requireUserAuth, userController.updateActivity);

// GET /api/users/room/:roomId/participants - Participantes de sala
router.get('/room/:roomId/participants', 
  requireUserAuth, 
  roomParticipantsValidation, 
  userController.getRoomParticipants
);

// POST /api/users/disconnect - Desconectar
router.post('/disconnect', requireUserAuth, userController.disconnect);

module.exports = router;