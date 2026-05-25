const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const quizCtrl = require('../controllers/quizController');
const adminCtrl = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─── AUTH ─────────────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);
router.put('/auth/profile', auth, upload.single('avatar'), authCtrl.updateProfile);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/reset-password', authCtrl.resetPassword);

// ─── QUIZZES ──────────────────────────────────────────────────
router.get('/quizzes', quizCtrl.getQuizzes);
router.get('/quizzes/:uuid', quizCtrl.getQuiz);
router.post('/quizzes', auth, upload.single('cover'), quizCtrl.createQuiz);
router.post('/quizzes/:uuid/publish', auth, quizCtrl.publishQuiz);
router.post('/quizzes/:uuid/attempt', auth, quizCtrl.submitAttempt);
router.get('/quizzes/:uuid/leaderboard', quizCtrl.getLeaderboard);

// ─── CATEGORIES ───────────────────────────────────────────────
router.get('/categories', quizCtrl.getCategories);

// ─── USER ─────────────────────────────────────────────────────
router.get('/user/history', auth, quizCtrl.getUserHistory);

// ─── ADMIN ───────────────────────────────────────────────────
router.get('/admin/dashboard', auth, adminOnly, adminCtrl.getDashboard);
router.get('/admin/users', auth, adminOnly, adminCtrl.getUsers);
router.put('/admin/users/:id', auth, adminOnly, adminCtrl.updateUser);
router.get('/admin/quizzes', auth, adminOnly, adminCtrl.getAllQuizzes);
router.put('/admin/quizzes/:id/toggle', auth, adminOnly, adminCtrl.togglePublish);
router.delete('/admin/quizzes/:id', auth, adminOnly, adminCtrl.deleteQuiz);
router.get('/admin/violations', auth, adminOnly, adminCtrl.getViolations);
router.get('/admin/categories', auth, adminOnly, adminCtrl.getCategories);
router.post('/admin/categories', auth, adminOnly, adminCtrl.createCategory);
router.delete('/admin/categories/:id', auth, adminOnly, adminCtrl.deleteCategory);

module.exports = router;
