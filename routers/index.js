const router = require('express').Router();
const prisma = require("../helpers/prisma");
const UserRouter = require('./user');
const TaskReportRouter = require('./taskReport');
const { calculateCharacterPercentage } = require('../controllers/characterChecker');


router.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "OK", database: "Connected" });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      database: "Disconnected",
      error: error.message,
    });
  }
});

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/login', (req, res) => {
  res.render('index');
});

router.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

router.get('/profile', (req, res) => {
  res.render('profile');
});

router.use('/user', UserRouter);
router.use('/task-reports', TaskReportRouter);

router.post('/api/character-check', calculateCharacterPercentage);

module.exports = router;
