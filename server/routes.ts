import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEmployeeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const assignments = await storage.getActiveTaskAssignments();
      
      // Filter assignments for this employee
      const personalTasks = assignments.filter(
        assignment => assignment.assignedTo === employeeId
      );
      
      res.json(personalTasks);
    } catch (error) {
      console.error("Error fetching personal tasks:", error);
      res.status(500).json({ error: "Failed to fetch personal tasks" });
    }
  });

  // Complete a task assignment
  app.patch("/api/task-assignments/:assignmentId/complete", async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const { notes } = req.body;
      
      const updated = await storage.updateTaskAssignment(assignmentId, {
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

  const httpServer = createServer(app);

  return httpServer;
}