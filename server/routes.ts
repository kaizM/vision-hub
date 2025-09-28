import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { TaskScheduler } from "./scheduler";
import { 
  insertEmployeeSchema,
  insertTaskRegularSchema,
  insertTaskSpecialSchema,
  insertTaskLogSchema,
  insertCartonLedgerSchema,
  insertShortcutSchema,
  insertTemperatureEquipmentSchema,
  insertTemperatureReadingSchema,
  insertMessageSchema,
  insertSettingSchema,
  insertCameraSchema,
  insertBannedFaceSchema,
  insertBannedPlateSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize and start the task scheduler
  const taskScheduler = new TaskScheduler(storage);
  taskScheduler.start();
  console.log('[STARTUP] Task scheduler initialized and started');
  // Employee authentication
  app.post("/api/employees/authenticate", async (req, res) => {
    try {
      const { pin } = req.body;
      if (!pin) {
        return res.status(400).json({ error: "PIN is required" });
      }

      const employee = await storage.getEmployeeByPin(pin);
      if (!employee) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Get all employees
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  // Create new employee
  app.post("/api/employees", async (req, res) => {
    try {
      const parsed = insertEmployeeSchema.parse(req.body);
      
      // Check PIN uniqueness
      const existingEmployee = await storage.getEmployeeByPin(parsed.pin);
      if (existingEmployee) {
        return res.status(400).json({ error: "PIN already exists. Please choose a different PIN." });
      }
      
      const employee = await storage.createEmployee(parsed);
      
      await storage.logEvent("employee:created", {
        employeeId: employee.id,
        name: employee.name,
        role: employee.role,
        timestamp: new Date()
      });
      
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid employee data", details: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  // Update employee
  app.patch("/api/employees/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
      const updates = req.body;
      
      // Check PIN uniqueness if PIN is being updated
      if (updates.pin) {
        const existingEmployee = await storage.getEmployeeByPin(updates.pin);
        if (existingEmployee && existingEmployee.id !== employeeId) {
          return res.status(400).json({ error: "PIN already exists. Please choose a different PIN." });
        }
      }
      
      const updated = await storage.updateEmployee(employeeId, updates);
      if (!updated) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      await storage.logEvent("employee:updated", {
        employeeId: updated.id,
        updates,
        timestamp: new Date()
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  // Deactivate employee (soft delete)
  app.put("/api/employees/:employeeId/deactivate", async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      const updated = await storage.updateEmployee(employeeId, { active: false });
      if (!updated) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      await storage.logEvent("employee:deactivated", {
        employeeId: updated.id,
        name: updated.name,
        timestamp: new Date()
      });
      
      res.json({ message: "Employee deactivated successfully", employee: updated });
    } catch (error) {
      console.error("Error deactivating employee:", error);
      res.status(500).json({ error: "Failed to deactivate employee" });
    }
  });

  // Reactivate employee
  app.put("/api/employees/:employeeId/reactivate", async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      const updated = await storage.updateEmployee(employeeId, { active: true });
      if (!updated) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      await storage.logEvent("employee:reactivated", {
        employeeId: updated.id,
        name: updated.name,
        timestamp: new Date()
      });
      
      res.json({ message: "Employee reactivated successfully", employee: updated });
    } catch (error) {
      console.error("Error reactivating employee:", error);
      res.status(500).json({ error: "Failed to reactivate employee" });
    }
  });

  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Get active task assignments
  app.get("/api/task-assignments", async (req, res) => {
    try {
      const assignments = await storage.getActiveTaskAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching task assignments:", error);
      res.status(500).json({ error: "Failed to fetch task assignments" });
    }
  });

  // Get personal tasks for an employee
  app.get("/api/employees/:employeeId/tasks", async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      // Get task logs assigned to this employee (this is where scheduler assigns tasks)
      const allTaskLogs = await storage.getAllTaskLogs();
      const personalTaskLogs = allTaskLogs.filter(
        (log: any) => log.assignedTo === employeeId && log.status === 'pending'
      );
      
      // Transform task logs to look like task assignments for compatibility
      const personalTasks = personalTaskLogs.map((log: any) => ({
        id: log.id,
        taskTitle: log.titleSnapshot,
        category: 'general',
        assignedTo: log.assignedTo,
        dueAt: log.dueAt,
        status: log.status,
        priority: 'medium',
        sourceType: log.sourceType,
        sourceId: log.sourceId
      }));
      
      console.log(`[API] Found ${personalTasks.length} personal tasks for employee ${employeeId}`);
      res.json(personalTasks);
    } catch (error) {
      console.error("Error fetching personal tasks:", error);
      res.status(500).json({ error: "Failed to fetch personal tasks" });
    }
  });

  // Complete a task assignment (now works with task logs)
  app.patch("/api/task-assignments/:assignmentId/complete", async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { notes } = req.body;
      
      // Update task log instead of task assignment
      const updated = await storage.updateTaskLog(assignmentId, {
        status: "done",
        completedAt: new Date(),
        notes: notes || ""
      });
      
      if (!updated) {
        return res.status(404).json({ error: "Task assignment not found" });
      }

      // Log the completion event
      await storage.logEvent("task:completed", {
        assignmentId,
        completedAt: new Date(),
        notes
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({ error: "Failed to complete task" });
    }
  });

  // Get all inventory items
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Update inventory count
  app.patch("/api/inventory/:itemId", async (req, res) => {
    try {
      const { itemId } = req.params;
      const { count, reason, employeeId } = req.body;
      
      const updated = await storage.updateInventoryItem(itemId, {
        count,
        lastCountTs: new Date()
      });
      
      if (!updated) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      // Log the inventory change
      await storage.logEvent("inventory:updated", {
        itemId,
        newCount: count,
        reason,
        employeeId,
        timestamp: new Date()
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ error: "Failed to update inventory" });
    }
  });

  // Get active check-ins
  app.get("/api/check-ins/active", async (req, res) => {
    try {
      const checkIns = await storage.getActiveCheckIns();
      res.json(checkIns);
    } catch (error) {
      console.error("Error fetching active check-ins:", error);
      res.status(500).json({ error: "Failed to fetch active check-ins" });
    }
  });

  // Create check-in
  app.post("/api/check-ins", async (req, res) => {
    try {
      const { employeeId, device } = req.body;
      
      const checkIn = await storage.createCheckIn(employeeId, device);
      
      // Log the check-in event
      await storage.logEvent("employee:checkin", {
        employeeId,
        device,
        timestamp: new Date()
      });
      
      res.json(checkIn);
    } catch (error) {
      console.error("Error creating check-in:", error);
      res.status(500).json({ error: "Failed to create check-in" });
    }
  });

  // Create check-out
  app.post("/api/check-outs", async (req, res) => {
    try {
      const { employeeId } = req.body;
      
      const checkOut = await storage.updateCheckOut(employeeId);
      
      if (!checkOut) {
        return res.status(404).json({ error: "Active check-in not found" });
      }

      // Log the check-out event
      await storage.logEvent("employee:checkout", {
        employeeId,
        timestamp: new Date()
      });
      
      res.json(checkOut);
    } catch (error) {
      console.error("Error creating check-out:", error);
      res.status(500).json({ error: "Failed to create check-out" });
    }
  });

  // Get recent events
  app.get("/api/events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getRecentEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Create an employee call event
  app.post("/api/employee-calls", async (req, res) => {
    try {
      const { employeeId, employeeName, taskId, taskTitle } = req.body;
      
      // Log the call event
      const callEvent = await storage.logEvent("employee:called", {
        employeeId,
        employeeName,
        taskId,
        taskTitle,
        timestamp: new Date()
      });
      
      res.json({ success: true, eventId: callEvent.id });
    } catch (error) {
      console.error("Error creating employee call:", error);
      res.status(500).json({ error: "Failed to create employee call" });
    }
  });

  // ==========================================
  // MANAGER AUTHENTICATION APIs
  // ==========================================

  // Verify Manager PIN
  app.post("/api/manager/authenticate", async (req, res) => {
    try {
      const { pin } = req.body;
      
      if (!pin) {
        return res.status(400).json({ error: "Manager PIN is required" });
      }

      // Get manager PIN from settings
      const managerPinSetting = await storage.getSetting('manager_pin');
      const managerPin = managerPinSetting?.value || '786110';
      
      if (pin === managerPin) {
        await storage.logEvent("manager:login", {
          pin: "****",
          timestamp: new Date()
        });
        
        res.json({ 
          success: true, 
          role: "manager",
          name: "Manager",
          id: "manager",
          pin: pin
        });
      } else {
        await storage.logEvent("manager:login_failed", {
          timestamp: new Date()
        });
        
        res.status(401).json({ error: "Invalid Manager PIN" });
      }
    } catch (error) {
      console.error("Manager authentication error:", error);
      res.status(500).json({ error: "Manager authentication failed" });
    }
  });

  // Manager authorization middleware
  const requireManagerAuth = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Manager ')) {
        return res.status(401).json({ error: "Manager authorization required" });
      }

      const pin = authHeader.substring(8); // Remove 'Manager ' prefix
      const managerPinSetting = await storage.getSetting('manager_pin');
      const managerPin = managerPinSetting?.value || '786110';
      
      if (pin !== managerPin) {
        await storage.logEvent("manager:unauthorized_access", {
          timestamp: new Date(),
          ip: req.ip
        });
        return res.status(403).json({ error: "Invalid manager credentials" });
      }

      next();
    } catch (error) {
      console.error("Manager auth middleware error:", error);
      res.status(500).json({ error: "Authorization failed" });
    }
  };

  // Get Manager dashboard data (requires Manager authentication)
  app.get("/api/manager/dashboard", requireManagerAuth, async (req, res) => {
    try {
      const dashboardData = {
        totalEmployees: (await storage.getAllEmployees()).length,
        activeTaskLogs: (await storage.getPendingTaskLogs()).length,
        overdueTaskLogs: (await storage.getOverdueTaskLogs()).length,
        recentEvents: await storage.getRecentEvents(20),
        cartonTotal: await storage.getCartonTotal(),
        systemSettings: await storage.getAllSettings()
      };
      
      await storage.logEvent("manager:dashboard_access", {
        timestamp: new Date()
      });
      
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching manager dashboard:", error);
      res.status(500).json({ error: "Failed to fetch manager dashboard" });
    }
  });

  // Protected Manager-only routes
  app.get("/api/manager/all-employees", requireManagerAuth, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching all employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.post("/api/manager/system-settings", requireManagerAuth, async (req, res) => {
    try {
      const { key, value } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      
      const setting = await storage.setSetting(key, value);
      
      await storage.logEvent("manager:setting_changed", {
        key,
        value,
        timestamp: new Date()
      });
      
      res.json(setting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ error: "Failed to update system setting" });
    }
  });

  // ==========================================
  // TASK SCHEDULING SYSTEM (PHASE 2) APIs
  // ==========================================

  // Regular Tasks APIs (Recurring Templates)
  app.get("/api/tasks-regular", async (req, res) => {
    try {
      const tasks = await storage.getAllTasksRegular();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching regular tasks:", error);
      res.status(500).json({ error: "Failed to fetch regular tasks" });
    }
  });

  app.post("/api/tasks-regular", async (req, res) => {
    try {
      const parsed = insertTaskRegularSchema.parse(req.body);
      const task = await storage.createTaskRegular(parsed);
      
      await storage.logEvent("task_regular:created", {
        taskId: task.id,
        title: task.title,
        frequency: task.frequencyMinutes,
        timestamp: new Date()
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      console.error("Error creating regular task:", error);
      res.status(500).json({ error: "Failed to create regular task" });
    }
  });

  app.patch("/api/tasks-regular/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const updates = req.body;
      
      const updated = await storage.updateTaskRegular(taskId, updates);
      if (!updated) {
        return res.status(404).json({ error: "Regular task not found" });
      }
      
      await storage.logEvent("task_regular:updated", {
        taskId: updated.id,
        updates,
        timestamp: new Date()
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating regular task:", error);
      res.status(500).json({ error: "Failed to update regular task" });
    }
  });

  app.delete("/api/tasks-regular/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const deleted = await storage.deleteTaskRegular(taskId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Regular task not found" });
      }
      
      await storage.logEvent("task_regular:deleted", {
        taskId,
        timestamp: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting regular task:", error);
      res.status(500).json({ error: "Failed to delete regular task" });
    }
  });

  // Special Tasks APIs (One-off Tasks)
  app.get("/api/tasks-special", async (req, res) => {
    try {
      const tasks = await storage.getAllTasksSpecial();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching special tasks:", error);
      res.status(500).json({ error: "Failed to fetch special tasks" });
    }
  });

  app.post("/api/tasks-special", async (req, res) => {
    try {
      const parsed = insertTaskSpecialSchema.parse(req.body);
      const task = await storage.createTaskSpecial(parsed);
      
      // If task is assigned to someone, create a task log immediately and trigger call
      if (task.assignedTo) {
        const employee = await storage.getEmployee(task.assignedTo);
        if (employee) {
          // Create task log
          const taskLog = await storage.createTaskLog({
            sourceType: 'special',
            sourceId: task.id,
            assignedTo: task.assignedTo,
            status: 'pending',
            titleSnapshot: task.title,
            dueAt: task.dueAt || new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now if no due date
          });
          
          // Log the call event for assigned task
          await storage.logEvent("employee:called", {
            employeeId: task.assignedTo,
            employeeName: employee.name,
            taskId: taskLog.id,
            taskTitle: task.title,
            timestamp: new Date()
          });
        }
      }
      
      await storage.logEvent("task_special:created", {
        taskId: task.id,
        title: task.title,
        assignedTo: task.assignedTo,
        timestamp: new Date()
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      console.error("Error creating special task:", error);
      res.status(500).json({ error: "Failed to create special task" });
    }
  });

  app.patch("/api/tasks-special/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const updates = req.body;
      
      const updated = await storage.updateTaskSpecial(taskId, updates);
      if (!updated) {
        return res.status(404).json({ error: "Special task not found" });
      }
      
      await storage.logEvent("task_special:updated", {
        taskId: updated.id,
        updates,
        timestamp: new Date()
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating special task:", error);
      res.status(500).json({ error: "Failed to update special task" });
    }
  });

  // Task Logs APIs (Actual Task Instances)
  app.get("/api/task-logs", async (req, res) => {
    try {
      const { employeeId, status } = req.query;
      
      let taskLogs;
      if (employeeId) {
        taskLogs = await storage.getTaskLogsByEmployee(employeeId as string);
      } else if (status === 'pending') {
        taskLogs = await storage.getPendingTaskLogs();
      } else if (status === 'overdue') {
        taskLogs = await storage.getOverdueTaskLogs();
      } else {
        // Get all pending by default
        taskLogs = await storage.getPendingTaskLogs();
      }
      
      res.json(taskLogs);
    } catch (error) {
      console.error("Error fetching task logs:", error);
      res.status(500).json({ error: "Failed to fetch task logs" });
    }
  });

  app.patch("/api/task-logs/:taskLogId", async (req, res) => {
    try {
      const { taskLogId } = req.params;
      const updates = req.body;
      
      const updated = await storage.updateTaskLog(taskLogId, updates);
      if (!updated) {
        return res.status(404).json({ error: "Task log not found" });
      }
      
      // Log different events based on status change
      if (updates.status === 'done') {
        await storage.logEvent("task:done", {
          taskLogId: updated.id,
          employeeId: updated.assignedTo,
          title: updated.titleSnapshot,
          timestamp: new Date()
        });
      } else if (updates.status === 'help') {
        await storage.logEvent("help:request", {
          taskLogId: updated.id,
          employeeId: updated.assignedTo,
          title: updated.titleSnapshot,
          timestamp: new Date()
        });
      } else if (updates.status === 'missed') {
        await storage.logEvent("task:missed", {
          taskLogId: updated.id,
          title: updated.titleSnapshot,
          timestamp: new Date()
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating task log:", error);
      res.status(500).json({ error: "Failed to update task log" });
    }
  });

  // ==========================================
  // CARTON INVENTORY SYSTEM APIs
  // ==========================================

  app.get("/api/cartons/total", async (req, res) => {
    try {
      const total = await storage.getCartonTotal();
      res.json({ total });
    } catch (error) {
      console.error("Error fetching carton total:", error);
      res.status(500).json({ error: "Failed to fetch carton total" });
    }
  });

  app.get("/api/cartons/ledger", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const ledger = await storage.getCartonLedger(limit);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching carton ledger:", error);
      res.status(500).json({ error: "Failed to fetch carton ledger" });
    }
  });

  app.post("/api/cartons/adjust", async (req, res) => {
    try {
      const parsed = insertCartonLedgerSchema.parse(req.body);
      
      // Validate amount for different actions
      if (['add', 'remove', 'set'].includes(parsed.action) && (!parsed.amount || parsed.amount < 0)) {
        return res.status(400).json({ error: "Amount is required and must be non-negative for this action" });
      }
      
      // Check if remove would make total negative
      if (parsed.action === 'remove') {
        const currentTotal = await storage.getCartonTotal();
        if ((parsed.amount || 0) > currentTotal) {
          return res.status(400).json({ error: "Insufficient stock - cannot remove more than current total" });
        }
      }
      
      const entry = await storage.addCartonEntry(parsed);
      
      await storage.logEvent("inventory:carton_apply", {
        employee: entry.employee,
        action: entry.action,
        amount: entry.amount,
        delta: entry.delta,
        totalAfter: entry.totalAfter,
        note: entry.note,
        timestamp: entry.timestamp
      });
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid carton entry data", details: error.errors });
      }
      console.error("Error adjusting carton inventory:", error);
      res.status(500).json({ error: "Failed to adjust carton inventory" });
    }
  });

  app.post("/api/cartons/undo", async (req, res) => {
    try {
      // Manager authorization check would go here in a real system
      const undone = await storage.removeLastCartonEntry();
      
      if (!undone) {
        return res.status(400).json({ error: "No carton entries to undo" });
      }
      
      const newTotal = await storage.getCartonTotal();
      
      await storage.logEvent("inventory:carton_undo", {
        totalAfter: newTotal,
        timestamp: new Date()
      });
      
      res.json({ success: true, newTotal });
    } catch (error) {
      console.error("Error undoing carton entry:", error);
      res.status(500).json({ error: "Failed to undo carton entry" });
    }
  });

  // ==========================================
  // QUICK SHORTCUTS (QS TILES) APIs
  // ==========================================

  app.get("/api/shortcuts", async (req, res) => {
    try {
      const { visible } = req.query;
      
      let shortcuts;
      if (visible === 'true') {
        shortcuts = await storage.getVisibleShortcuts();
      } else {
        shortcuts = await storage.getAllShortcuts();
      }
      
      res.json(shortcuts);
    } catch (error) {
      console.error("Error fetching shortcuts:", error);
      res.status(500).json({ error: "Failed to fetch shortcuts" });
    }
  });

  app.post("/api/shortcuts", async (req, res) => {
    try {
      const parsed = insertShortcutSchema.parse(req.body);
      const shortcut = await storage.createShortcut(parsed);
      
      await storage.logEvent("shortcut:created", {
        shortcutId: shortcut.id,
        name: shortcut.name,
        url: shortcut.url,
        timestamp: new Date()
      });
      
      res.status(201).json(shortcut);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid shortcut data", details: error.errors });
      }
      console.error("Error creating shortcut:", error);
      res.status(500).json({ error: "Failed to create shortcut" });
    }
  });

  app.patch("/api/shortcuts/:shortcutId", async (req, res) => {
    try {
      const { shortcutId } = req.params;
      const updates = req.body;
      
      const updated = await storage.updateShortcut(shortcutId, updates);
      if (!updated) {
        return res.status(404).json({ error: "Shortcut not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating shortcut:", error);
      res.status(500).json({ error: "Failed to update shortcut" });
    }
  });

  app.delete("/api/shortcuts/:shortcutId", async (req, res) => {
    try {
      const { shortcutId } = req.params;
      const deleted = await storage.deleteShortcut(shortcutId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Shortcut not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shortcut:", error);
      res.status(500).json({ error: "Failed to delete shortcut" });
    }
  });

  app.post("/api/shortcuts/reorder", async (req, res) => {
    try {
      const { shortcuts } = req.body; // Array of {id, sortOrder}
      
      if (!Array.isArray(shortcuts)) {
        return res.status(400).json({ error: "Shortcuts array required" });
      }
      
      const success = await storage.reorderShortcuts(shortcuts);
      res.json({ success });
    } catch (error) {
      console.error("Error reordering shortcuts:", error);
      res.status(500).json({ error: "Failed to reorder shortcuts" });
    }
  });

  // Track shortcut clicks for analytics
  app.post("/api/shortcuts/:shortcutId/click", async (req, res) => {
    try {
      const { shortcutId } = req.params;
      const shortcut = await storage.getAllShortcuts().then(shortcuts => 
        shortcuts.find(s => s.id === shortcutId)
      );
      
      if (!shortcut) {
        return res.status(404).json({ error: "Shortcut not found" });
      }
      
      await storage.logEvent("shortcut:click", {
        shortcutId: shortcut.id,
        name: shortcut.name,
        url: shortcut.url,
        timestamp: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging shortcut click:", error);
      res.status(500).json({ error: "Failed to log shortcut click" });
    }
  });

  // ==========================================
  // TEMPERATURE MONITORING SYSTEM APIs
  // ==========================================

  // Temperature Equipment APIs
  app.get("/api/temperature-equipment", async (req, res) => {
    try {
      const { active } = req.query;
      
      let equipment;
      if (active === 'true') {
        equipment = await storage.getActiveTemperatureEquipment();
      } else {
        equipment = await storage.getAllTemperatureEquipment();
      }
      
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching temperature equipment:", error);
      res.status(500).json({ error: "Failed to fetch temperature equipment" });
    }
  });

  app.post("/api/temperature-equipment", async (req, res) => {
    try {
      const parsed = insertTemperatureEquipmentSchema.parse(req.body);
      const equipment = await storage.createTemperatureEquipment(parsed);
      
      await storage.logEvent("temp_equipment:created", {
        equipmentId: equipment.id,
        name: equipment.name,
        minTemp: equipment.minTemp,
        maxTemp: equipment.maxTemp,
        intervalHours: equipment.intervalHours,
        timestamp: new Date()
      });
      
      res.status(201).json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid equipment data", details: error.errors });
      }
      console.error("Error creating temperature equipment:", error);
      res.status(500).json({ error: "Failed to create temperature equipment" });
    }
  });

  app.patch("/api/temperature-equipment/:equipmentId", async (req, res) => {
    try {
      const { equipmentId } = req.params;
      const updates = req.body;
      
      const updated = await storage.updateTemperatureEquipment(equipmentId, updates);
      if (!updated) {
        return res.status(404).json({ error: "Temperature equipment not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating temperature equipment:", error);
      res.status(500).json({ error: "Failed to update temperature equipment" });
    }
  });

  app.delete("/api/temperature-equipment/:equipmentId", async (req, res) => {
    try {
      const { equipmentId } = req.params;
      const deleted = await storage.deleteTemperatureEquipment(equipmentId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Temperature equipment not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting temperature equipment:", error);
      res.status(500).json({ error: "Failed to delete temperature equipment" });
    }
  });

  // Temperature Readings APIs
  app.get("/api/temperature-readings", async (req, res) => {
    try {
      const { equipmentId, limit } = req.query;
      
      const readings = await storage.getTemperatureReadings(
        equipmentId as string,
        parseInt(limit as string) || 100
      );
      
      res.json(readings);
    } catch (error) {
      console.error("Error fetching temperature readings:", error);
      res.status(500).json({ error: "Failed to fetch temperature readings" });
    }
  });

  app.post("/api/temperature-readings", async (req, res) => {
    try {
      const parsed = insertTemperatureReadingSchema.parse(req.body);
      
      // Get equipment to validate temperature against thresholds
      const equipment = await storage.getAllTemperatureEquipment().then(equipments => 
        equipments.find(e => e.id === parsed.equipmentId)
      );
      
      if (!equipment) {
        return res.status(400).json({ error: "Temperature equipment not found" });
      }
      
      // Determine status based on thresholds
      let status = 'ok';
      if (parsed.value < equipment.minTemp) {
        status = 'low';
      } else if (parsed.value > equipment.maxTemp) {
        status = 'high';
      }
      
      const reading = await storage.addTemperatureReading({
        ...parsed,
        status
      });
      
      // Log appropriate events based on status
      if (status === 'ok') {
        await storage.logEvent("temp:reading_ok", {
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          value: reading.value,
          timestamp: new Date()
        });
      } else {
        await storage.logEvent("temp:alert", {
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          value: reading.value,
          status,
          threshold: status === 'low' ? equipment.minTemp : equipment.maxTemp,
          timestamp: new Date()
        });
      }
      
      res.status(201).json(reading);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reading data", details: error.errors });
      }
      console.error("Error adding temperature reading:", error);
      res.status(500).json({ error: "Failed to add temperature reading" });
    }
  });

  // ==========================================
  // MESSAGING SYSTEM APIs
  // ==========================================

  app.get("/api/messages", async (req, res) => {
    try {
      const { recipientId, type, limit } = req.query;
      
      let messages;
      if (type === 'broadcast') {
        messages = await storage.getBroadcastMessages(parseInt(limit as string) || 50);
      } else {
        messages = await storage.getMessages(
          recipientId as string,
          parseInt(limit as string) || 100
        );
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const parsed = insertMessageSchema.parse(req.body);
      const message = await storage.sendMessage(parsed);
      
      // Log different events based on message type
      if (parsed.type === 'broadcast') {
        await storage.logEvent("message:broadcast", {
          messageId: message.id,
          content: message.content,
          senderId: message.senderId,
          timestamp: new Date()
        });
      } else {
        await storage.logEvent("message:direct", {
          messageId: message.id,
          content: message.content,
          senderId: message.senderId,
          recipientId: message.recipientId,
          timestamp: new Date()
        });
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message data", details: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.patch("/api/messages/:messageId/read", async (req, res) => {
    try {
      const { messageId } = req.params;
      const updated = await storage.markMessageRead(messageId);
      
      if (!updated) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // ==========================================
  // SETTINGS MANAGEMENT APIs
  // ==========================================

  app.get("/api/settings", async (req, res) => {
    try {
      const { key } = req.query;
      
      if (key) {
        const setting = await storage.getSetting(key as string);
        if (!setting) {
          return res.status(404).json({ error: "Setting not found" });
        }
        res.json(setting);
      } else {
        const settings = await storage.getAllSettings();
        res.json(settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      
      const setting = await storage.setSetting(key, value);
      
      await storage.logEvent("setting:updated", {
        key,
        value,
        timestamp: new Date()
      });
      
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // ==========================================
  // CAMERA MANAGEMENT APIs
  // ==========================================

  app.get("/api/cameras", async (req, res) => {
    try {
      const { active } = req.query;
      
      let cameras;
      if (active === 'true') {
        cameras = await storage.getActiveCameras();
      } else {
        cameras = await storage.getAllCameras();
      }
      
      res.json(cameras);
    } catch (error) {
      console.error("Error fetching cameras:", error);
      res.status(500).json({ error: "Failed to fetch cameras" });
    }
  });

  app.post("/api/cameras", async (req, res) => {
    try {
      const parsed = insertCameraSchema.parse(req.body);
      const camera = await storage.createCamera(parsed);
      
      await storage.logEvent("camera:created", {
        cameraId: camera.id,
        name: camera.name,
        enabled: camera.enabled,
        timestamp: new Date()
      });
      
      res.status(201).json(camera);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid camera data", details: error.errors });
      }
      console.error("Error creating camera:", error);
      res.status(500).json({ error: "Failed to create camera" });
    }
  });

  app.patch("/api/cameras/:cameraId", async (req, res) => {
    try {
      const { cameraId } = req.params;
      const updates = req.body;
      
      const updated = await storage.updateCamera(cameraId, updates);
      if (!updated) {
        return res.status(404).json({ error: "Camera not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating camera:", error);
      res.status(500).json({ error: "Failed to update camera" });
    }
  });

  app.delete("/api/cameras/:cameraId", async (req, res) => {
    try {
      const { cameraId } = req.params;
      const deleted = await storage.deleteCamera(cameraId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Camera not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting camera:", error);
      res.status(500).json({ error: "Failed to delete camera" });
    }
  });

  // Scheduler status and control endpoints
  app.get("/api/scheduler/status", async (req, res) => {
    try {
      const status = taskScheduler.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting scheduler status:", error);
      res.status(500).json({ error: "Failed to get scheduler status" });
    }
  });

  app.post("/api/scheduler/force-run", async (req, res) => {
    try {
      await taskScheduler.forceRun();
      res.json({ success: true, message: "Scheduler force run completed" });
    } catch (error) {
      console.error("Error force running scheduler:", error);
      res.status(500).json({ error: "Failed to force run scheduler" });
    }
  });

  // ==========================================
  // VISION APIs (Banned Faces/Plates)
  // ==========================================
  
  // Banned Faces
  app.get("/api/vision/faces", async (req, res) => {
    try {
      const faces = await storage.getBannedFaces();
      res.json(faces);
    } catch (error) {
      console.error("Error fetching banned faces:", error);
      res.status(500).json({ error: "Failed to fetch banned faces" });
    }
  });

  app.post("/api/vision/faces", async (req, res) => {
    try {
      const parsed = insertBannedFaceSchema.parse(req.body);
      const face = await storage.createBannedFace(parsed);
      
      await storage.logEvent("face:added", {
        faceId: face.id,
        label: face.label,
        timestamp: new Date()
      });
      
      res.status(201).json(face);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid face data", details: error.errors });
      }
      console.error("Error creating banned face:", error);
      res.status(500).json({ error: "Failed to create banned face" });
    }
  });

  app.delete("/api/vision/faces/:faceId", async (req, res) => {
    try {
      const { faceId } = req.params;
      const deleted = await storage.deleteBannedFace(faceId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Banned face not found" });
      }
      
      await storage.logEvent("face:removed", {
        faceId,
        timestamp: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting banned face:", error);
      res.status(500).json({ error: "Failed to delete banned face" });
    }
  });

  // Banned Plates
  app.get("/api/vision/plates", async (req, res) => {
    try {
      const plates = await storage.getBannedPlates();
      res.json(plates);
    } catch (error) {
      console.error("Error fetching banned plates:", error);
      res.status(500).json({ error: "Failed to fetch banned plates" });
    }
  });

  app.post("/api/vision/plates", async (req, res) => {
    try {
      const parsed = insertBannedPlateSchema.parse(req.body);
      const plate = await storage.createBannedPlate(parsed);
      
      await storage.logEvent("plate:added", {
        plateId: plate.id,
        plateText: plate.plateText,
        timestamp: new Date()
      });
      
      res.status(201).json(plate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid plate data", details: error.errors });
      }
      console.error("Error creating banned plate:", error);
      res.status(500).json({ error: "Failed to create banned plate" });
    }
  });

  app.delete("/api/vision/plates/:plateId", async (req, res) => {
    try {
      const { plateId } = req.params;
      const deleted = await storage.deleteBannedPlate(plateId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Banned plate not found" });
      }
      
      await storage.logEvent("plate:removed", {
        plateId,
        timestamp: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting banned plate:", error);
      res.status(500).json({ error: "Failed to delete banned plate" });
    }
  });

  // Vision Alerts (Event Log queries for face/plate alerts)
  app.get("/api/vision/alerts", async (req, res) => {
    try {
      const { type } = req.query;
      const events = await storage.getEventsByType(type as string || "alert");
      
      // Filter for vision-related alerts
      const visionAlerts = events.filter(event => 
        event.type === "alert" && 
        (event.detail.alertType === "face" || event.detail.alertType === "plate")
      );
      
      res.json(visionAlerts);
    } catch (error) {
      console.error("Error fetching vision alerts:", error);
      res.status(500).json({ error: "Failed to fetch vision alerts" });
    }
  });

  // Vision file upload endpoint with OpenCV processing simulation
  app.post("/api/vision/upload", async (req, res) => {
    try {
      // Handle JSON-based file upload (base64 encoded)
      const { file, type, label } = req.body;
      
      if (!file || !file.name) {
        return res.status(400).json({ error: "File data is required" });
      }
      
      // Simulate file processing and face recognition with OpenCV
      const uploadResult = {
        id: `upload_${Date.now()}`,
        originalName: file.name,
        path: `/uploads/vision/${Date.now()}_${file.name}`,
        type: type || 'face',
        label: label || 'Unknown',
        fileSize: file.size || 0,
        fileType: file.type || 'unknown',
        processed: true,
        openCvData: {
          faceDetected: true,
          confidence: 0.95,
          boundingBox: { x: 100, y: 100, width: 200, height: 200 },
          bodyStructure: {
            height: 175,
            landmarks: ['face', 'shoulders', 'posture'],
            recognitionScore: 0.92
          }
        },
        createdAt: new Date()
      };

      // Log the vision upload event
      await storage.logEvent("vision:upload", {
        uploadId: uploadResult.id,
        fileName: file.name,
        type: uploadResult.type,
        label: uploadResult.label,
        processed: uploadResult.processed,
        timestamp: new Date()
      });

      res.status(201).json(uploadResult);
    } catch (error) {
      console.error("Vision upload error:", error);
      res.status(500).json({ error: "Failed to process vision upload" });
    }
  });

  // ==========================================
  // EMPLOYEE CALLING & MESSAGING APIs
  // ==========================================

  // Send employee call/work assignment
  app.post("/api/employee-calling/send", async (req, res) => {
    try {
      const { employeeIds, message, method } = req.body;
      
      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ error: "Employee IDs are required" });
      }
      
      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Log the calling event
      await storage.logEvent("employee:calling", {
        employeeIds,
        message: message.trim(),
        method: method || "voice",
        timestamp: new Date()
      });

      // If voice method, simulate voice announcement
      if (method === "voice") {
        const employees = await storage.getAllEmployees();
        const selectedEmployees = employees.filter(e => employeeIds.includes(e.id));
        const employeeNames = selectedEmployees.map(e => e.name).join(", ");
        
        await storage.logEvent("system:voice_announcement", {
          announcement: `Calling ${employeeNames}: ${message}`,
          employeeCount: employeeIds.length,
          timestamp: new Date()
        });
      }

      res.json({ 
        success: true, 
        employeeCount: employeeIds.length,
        method: method || "voice",
        message: "Call sent successfully"
      });
    } catch (error) {
      console.error("Error sending employee call:", error);
      res.status(500).json({ error: "Failed to send employee call" });
    }
  });

  // Send message to employees
  app.post("/api/messages/send", async (req, res) => {
    try {
      const { type, recipientId, content, scheduledTime } = req.body;
      
      if (!type || !["broadcast", "direct"].includes(type)) {
        return res.status(400).json({ error: "Valid message type is required" });
      }
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      if (type === "direct" && !recipientId) {
        return res.status(400).json({ error: "Recipient ID is required for direct messages" });
      }

      const messageData = {
        type,
        recipientId: type === "direct" ? recipientId : null,
        senderId: "manager", // Manager sending message
        content: content.trim(),
        scheduledTime: scheduledTime || null
      };

      // Log the message event
      await storage.logEvent("message:sent", {
        type: messageData.type,
        recipientId: messageData.recipientId,
        content: messageData.content,
        scheduled: !!scheduledTime,
        timestamp: new Date()
      });

      res.status(201).json({ 
        success: true, 
        messageId: `msg_${Date.now()}`,
        type: messageData.type,
        scheduled: !!scheduledTime
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get messages (for display in admin)
  app.get("/api/messages", async (req, res) => {
    try {
      // Get message events from event log
      const events = await storage.getEventsByType("message:sent");
      
      const messages = events.map(event => ({
        id: event.id,
        type: event.detail.type,
        recipientId: event.detail.recipientId,
        content: event.detail.content,
        sentAt: event.ts,
        scheduled: event.detail.scheduled || false
      }));

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // ==========================================
  // SETTINGS APIs (Domain Whitelist)
  // ==========================================
  
  app.get("/api/settings/domain-whitelist", async (req, res) => {
    try {
      const enabledSetting = await storage.getSetting("domain_whitelist_enabled");
      const domainsSetting = await storage.getSetting("domain_whitelist_domains");
      
      res.json({
        enabled: enabledSetting?.value === "true" || false,
        domains: domainsSetting?.value || ""
      });
    } catch (error) {
      console.error("Error fetching domain whitelist settings:", error);
      res.status(500).json({ error: "Failed to fetch domain whitelist settings" });
    }
  });

  app.post("/api/settings/domain-whitelist", async (req, res) => {
    try {
      const { enabled, domains } = req.body;
      
      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }
      
      if (domains && typeof domains !== "string") {
        return res.status(400).json({ error: "domains must be a string" });
      }
      
      // Update or create settings
      await storage.setSetting("domain_whitelist_enabled", enabled.toString());
      await storage.setSetting("domain_whitelist_domains", domains || "");
      
      await storage.logEvent("settings:domain_whitelist_updated", {
        enabled,
        domains: domains || "",
        timestamp: new Date()
      });
      
      res.json({
        enabled,
        domains: domains || ""
      });
    } catch (error) {
      console.error("Error updating domain whitelist settings:", error);
      res.status(500).json({ error: "Failed to update domain whitelist settings" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}