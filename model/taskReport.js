const prisma = require('../helpers/prisma');

class TaskReportModel {
  static async findAll(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 10,
      department,
      position,
      status,
      priority,
      employeeId,
    } = { ...filters, ...pagination };
    const skip = (page - 1) * limit;

    const where = {};
    if (department) {
      where.department = { contains: department };
    }

    if (position) {
      where.position = { contains: position };
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (employeeId) {
      where.employeeId = parseInt(employeeId, 10);
    }

    const [reports, total] = await Promise.all([
      prisma.taskReport.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              fullname: true,
              email: true,
              department: true,
              position: true,
            },
          },
          creator: {
            select: { id: true, fullname: true },
          },
        },
      }),
      prisma.taskReport.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  static async findById(id) {
    return await prisma.taskReport.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          select: {
            id: true,
            fullname: true,
            email: true,
            position: true,
            department: true,
          },
        },
        creator: {
          select: { id: true, fullname: true },
        },
      },
    });
  }

  static async create(data, createdById) {
    const {
      employeeId,
      employeeName,
      position,
      department,
      taskTitle,
      taskDescription,
      priority = "medium",
      status = "pending",
      startDate,
      dueDate,
      estimatedHours = 0,
      notes,
    } = data;

    return await prisma.taskReport.create({
      data: {
        employeeId: parseInt(employeeId),
        employeeName,
        position,
        department,
        taskTitle,
        taskDescription,
        priority,
        status,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        estimatedHours: parseFloat(estimatedHours),
        notes,
        createdBy: createdById,
      },
      include: {
        employee: {
          select: { id: true, fullname: true, email: true },
        },
        creator: {
          select: { id: true, fullname: true },
        },
      },
    });
  }

  static async update(id, data) {
    const {
      employeeId,
      employeeName,
      position,
      department,
      taskTitle,
      taskDescription,
      priority,
      status,
      startDate,
      dueDate,
      completedDate,
      estimatedHours,
      actualHours,
      progressPercentage,
      notes,
      createdById,
    } = data;

    const updateData = {
      employeeId: employeeId ? parseInt(employeeId) : undefined,
      employeeName,
      position,
      department,
      taskTitle,
      taskDescription,
      priority,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      completedDate: completedDate ? new Date(completedDate) : undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      actualHours: actualHours ? parseFloat(actualHours) : undefined,
      progressPercentage: progressPercentage
        ? parseInt(progressPercentage)
        : undefined,
      notes,
      createdBy: createdById,
    };

    return await prisma.taskReport.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        employee: {
          select: { id: true, fullname: true, email: true },
        },
        creator: {
          select: { id: true, fullname: true },
        },
      },
    });
  }

  static async delete(id) {
    return await prisma.taskReport.delete({
      where: { id: parseInt(id) },
    });
  }

  static async getTaskAnalytics(filters = {}) {
    const { employeeId, department, startDate, endDate } = filters;

    const where = {};
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (department)
      where.department = { contains: department };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const tasks = await prisma.taskReport.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullname: true,
            department: true,
            position: true,
          },
        },
      },
    });

    // Nested loop implementation for analytics
    const analytics = {
      totalTasks: tasks.length,
      departmentStats: {},
      priorityStats: {},
      statusStats: {},
      employeeStats: {},

      timeAnalysis: {
        averageEstimatedHours: 0,
        averageActualHours: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0,
        efficiencyRate: 0,
      },
      progressAnalysis: {
        averageProgress: 0,
        completedTasks: 0,
        onTimeTasks: 0,
        delayedTasks: 0,
      },
    };

    // Nested loop for department and priority analysis
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      if (!analytics.departmentStats[task.department]) {
        analytics.departmentStats[task.department] = {
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          cancelled: 0,
          averageProgress: 0,
          totalEstimatedHours: 0,
          totalActualHours: 0,
        };
      }

      analytics.departmentStats[task.department].total++;
      analytics.departmentStats[task.department].totalEstimatedHours +=
        task.estimatedHours;
      analytics.departmentStats[task.department].totalActualHours +=
        task.actualHours;

      // Nested if for status categorization
      if (task.status === "completed") {
        analytics.departmentStats[task.department].completed++;
        analytics.progressAnalysis.completedTasks++;

        if (task.completedDate && task.completedDate <= task.dueDate) {
          analytics.progressAnalysis.onTimeTasks++;
        } else if (task.completedDate && task.completedDate > task.dueDate) {
          analytics.progressAnalysis.delayedTasks++;
        }
      } else if (task.status === "pending") {
        analytics.departmentStats[task.department].pending++;
      } else if (task.status === "in_progress") {
        analytics.departmentStats[task.department].inProgress++;
      } else if (task.status === "cancelled") {
        analytics.departmentStats[task.department].cancelled++;
      }

      if (!analytics.priorityStats[task.priority]) {
        analytics.priorityStats[task.priority] = { count: 0, completed: 0 };
      }
      analytics.priorityStats[task.priority].count++;
      if (task.status === "completed") {
        analytics.priorityStats[task.priority].completed++;
      }

      if (!analytics.statusStats[task.status]) {
        analytics.statusStats[task.status] = 0;
      }
      analytics.statusStats[task.status]++;

      // Employee stats with nested loop for task comparison
      const employeeKey = `${task.employee.fullname} (${task.employee.department})`;
      if (!analytics.employeeStats[employeeKey]) {
        analytics.employeeStats[employeeKey] = {
          totalTasks: 0,
          completedTasks: 0,
          averageProgress: 0,
          totalEstimatedHours: 0,
          totalActualHours: 0,
          efficiencyScore: 0,
        };
      }

      analytics.employeeStats[employeeKey].totalTasks++;
      analytics.employeeStats[employeeKey].totalEstimatedHours +=
        task.estimatedHours;
      analytics.employeeStats[employeeKey].totalActualHours += task.actualHours;

      if (task.status === "completed") {
        analytics.employeeStats[employeeKey].completedTasks++;
      }

      analytics.timeAnalysis.totalEstimatedHours += task.estimatedHours;
      analytics.timeAnalysis.totalActualHours += task.actualHours;
      analytics.progressAnalysis.averageProgress += task.progressPercentage;
    }

    if (tasks.length > 0) {
      analytics.timeAnalysis.averageEstimatedHours =
        Math.round(
          (analytics.timeAnalysis.totalEstimatedHours / tasks.length) * 100
        ) / 100;
      analytics.timeAnalysis.averageActualHours =
        Math.round(
          (analytics.timeAnalysis.totalActualHours / tasks.length) * 100
        ) / 100;

      if (analytics.timeAnalysis.totalActualHours > 0) {
        analytics.timeAnalysis.efficiencyRate = Math.round(
          (analytics.timeAnalysis.totalEstimatedHours /
            analytics.timeAnalysis.totalActualHours) *
            100
        );
      }

      analytics.progressAnalysis.averageProgress =
        Math.round(
          (analytics.progressAnalysis.averageProgress / tasks.length) * 100
        ) / 100;
    }

    for (const dept in analytics.departmentStats) {
      const deptData = analytics.departmentStats[dept];
      if (deptData.total > 0) {
        deptData.averageProgress = Math.round(
          (deptData.completed / deptData.total) * 100
        );
      }
    }

    for (const employee in analytics.employeeStats) {
      const empData = analytics.employeeStats[employee];
      if (empData.totalTasks > 0) {
        empData.averageProgress = Math.round(
          (empData.completedTasks / empData.totalTasks) * 100
        );

        if (empData.totalActualHours > 0) {
          empData.efficiencyScore = Math.round(
            (empData.totalEstimatedHours / empData.totalActualHours) * 100
          );
        }
      }
    }

    analytics.completionRate = analytics.totalTasks > 0 
      ? Math.round((analytics.progressAnalysis.completedTasks / analytics.totalTasks) * 100)
      : 0;
    
    analytics.averageEfficiency = analytics.timeAnalysis.efficiencyRate || 0;
    analytics.totalEstimatedHours = analytics.timeAnalysis.totalEstimatedHours;
    analytics.totalActualHours = analytics.timeAnalysis.totalActualHours;
    analytics.completedTasks = analytics.progressAnalysis.completedTasks;
    analytics.timeVariance = analytics.timeAnalysis.totalActualHours - analytics.timeAnalysis.totalEstimatedHours;

    // Add missing fields to department stats
    for (const dept in analytics.departmentStats) {
      const deptData = analytics.departmentStats[dept];
      deptData.totalTasks = deptData.total;
      deptData.completedTasks = deptData.completed;
      deptData.completionRate = deptData.total > 0 
        ? Math.round((deptData.completed / deptData.total) * 100)
        : 0;

    }

    // Add missing fields to priority stats
    for (const priority in analytics.priorityStats) {
      const priorityData = analytics.priorityStats[priority];
      priorityData.completionRate = priorityData.count > 0 
        ? Math.round((priorityData.completed / priorityData.count) * 100)
        : 0;
    }

    // Add topPerformers field
    analytics.topPerformers = [];
    for (const employeeName in analytics.employeeStats) {
      const empData = analytics.employeeStats[employeeName];
      const [name, department] = employeeName.includes('(') 
        ? [employeeName.split(' (')[0], employeeName.split(' (')[1].replace(')', '')]
        : [employeeName, 'Unknown'];
      
      analytics.topPerformers.push({
        name: name,
        department: department,
        completedTasks: empData.completedTasks || 0,
        efficiency: empData.efficiencyScore || 0
      });
    }
    
    // Sort by completed tasks descending
    analytics.topPerformers.sort((a, b) => b.completedTasks - a.completedTasks);

    return analytics;
  }
}

module.exports = TaskReportModel;
