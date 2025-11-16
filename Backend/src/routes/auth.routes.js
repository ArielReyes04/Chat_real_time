const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');

// Validaciones con express-validator
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username solo puede contener letras, números, guiones y puntos'),
  
  body('email')
    .isEmail()
    .withMessage('Email debe tener un formato válido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password debe contener al menos una mayúscula, una minúscula y un número')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email debe tener un formato válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password es requerido')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Contraseña actual es requerida'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nueva contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirmación de contraseña es requerida')
];

// Rutas públicas
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);

// Rutas protegidas (requieren autenticación de administrador)
router.get('/profile', requireAuth, authController.getProfile);
router.post('/change-password', requireAuth, changePasswordValidation, authController.changePassword);
router.post('/logout', requireAuth, authController.logout);
router.get('/verify-token', requireAuth, authController.verifyToken);

router.get('/admins/active', requireAuth, authController.getActiveAdmins);
router.put('/admins/:adminId/activate', requireAuth, authController.activateAdmin);
router.put('/admins/:adminId/desactivate', requireAuth, authController.desactivateAdmin);


module.exports = router;