const router = require('express').Router();
const TaskReportController = require('../controllers/taskReport');
const { authentication, authorization } = require('../middlewares/Authentication');

router.use(authentication);

router.get('/', TaskReportController.getAllTaskReports);
router.get('/:id', TaskReportController.getTaskReportById);
router.get('/analytics/data', TaskReportController.getTaskAnalytics);
router.post('/', TaskReportController.createTaskReport);
router.put('/:id', TaskReportController.updateTaskReport);
router.delete('/:id', authorization('admin'), TaskReportController.deleteTaskReport);

module.exports = router;