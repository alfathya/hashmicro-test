const TaskReportModel = require('../model/taskReport');

class TaskReportController {
  static async getAllTaskReports(req, res, next) {
    try {
      const { page, limit, department, position, status, priority } = req.query;
      const { user } = req;
      
      let filters = { department, position, status, priority };
      
      if (user.role === 'employee') {
        filters.employeeId = user.id.toString();
      }
      
      const result = await TaskReportModel.findAll(
        filters,
        { page, limit }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTaskReportById(req, res, next) {
    try {
      const { id } = req.params;
      const { user } = req;

      const taskReport = await TaskReportModel.findById(id);

      if (!taskReport) {
        return res.status(404).json({
          success: false,
          message: 'Task report not found'
        });
      }

      if (user.role === 'employee' && taskReport.employeeId !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own task reports'
        });
      }

      res.json({
        success: true,
        data: taskReport
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTaskReport(req, res, next) {
    try {
      const { user } = req;
      const {
        employeeId,
        taskTitle,
        taskDescription,
        priority,
        status,
        startDate,
        dueDate,
        estimatedHours,
        actualHours,

        notes
      } = req.body;

      if (!employeeId || !taskTitle || !startDate || !dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: employeeId, taskTitle, startDate, dueDate'
        });
      }

      if (user.role === 'employee' && parseInt(employeeId) !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only create task reports for yourself'
        });
      }

      const UserModel = require('../model/user');
      const employee = await UserModel.getProfile(employeeId);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      const parsedStartDate = new Date(startDate);
      const parsedDueDate = new Date(dueDate);

      const taskReport = await TaskReportModel.create({
        employeeId: parseInt(employeeId),
        employeeName: employee.fullname,
        position: employee.position || 'N/A',
        department: employee.department || 'N/A',
        taskTitle,
        taskDescription,
        priority: priority || 'medium',
        status: status || 'pending',
        startDate: parsedStartDate,
        dueDate: parsedDueDate,
        estimatedHours: estimatedHours || 0,
        actualHours: actualHours || 0,
        notes
      }, user.id);

      res.status(201).json({
        success: true,
        message: 'Task report created successfully',
        data: taskReport
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTaskReport(req, res, next) {
    try {
      const { id } = req.params;
      const { user } = req;
      const updateData = req.body;

      const existingReport = await TaskReportModel.findById(id);
      if (!existingReport) {
        return res.status(404).json({
          success: false,
          message: 'Task report not found'
        });
      }

      if (user.role === 'employee' && existingReport.employeeId !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own task reports'
        });
      }

      const updatedReport = await TaskReportModel.update(id, updateData);

      res.json({
        success: true,
        message: 'Task report updated successfully',
        data: updatedReport
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTaskReport(req, res, next) {
    try {
      const { id } = req.params;
      const { user } = req;

      const existingReport = await TaskReportModel.findById(id);
      if (!existingReport) {
        return res.status(404).json({
          success: false,
          message: 'Task report not found'
        });
      }

      if (user.role === 'employee' && existingReport.employeeId !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own task reports'
        });
      }

      await TaskReportModel.delete(id);

      res.json({
        success: true,
        message: 'Task report deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTaskAnalytics(req, res, next) {
    try {
      const { user } = req;
      const { employeeId, department, startDate, endDate } = req.query;
      
      let filters = { department, startDate, endDate };
      
      if (user.role === 'employee') {
        filters.employeeId = user.id;
      } else if (employeeId) {
        filters.employeeId = employeeId;
      }
      
      const analytics = await TaskReportModel.getTaskAnalytics(filters);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TaskReportController;