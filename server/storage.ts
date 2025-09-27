import { 
  type Employee, 
  type InsertEmployee,
  type Task,
  type InsertTask,
  type TaskAssignment,
  type InsertTaskAssignment,
  type InventoryItem,
  type InsertInventoryItem,
  type CheckInLog,
  type EventLog
} from "@shared/schema";
import { randomUUID } from "crypto";

// StoreHub storage interface
export interface IStorage {
  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByPin(pin: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  
  // Task methods
  createTask(task: InsertTask): Promise<Task>;
  getAllTasks(): Promise<Task[]>;
  getActiveTaskAssignments(): Promise<TaskAssignment[]>;
  createTaskAssignment(assignment: InsertTaskAssignment): Promise<TaskAssignment>;
  updateTaskAssignment(id: string, updates: Partial<TaskAssignment>): Promise<TaskAssignment | undefined>;
  
  // Inventory methods
  getAllInventoryItems(): Promise<InventoryItem[]>;
  updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  
  // Check-in methods
  createCheckIn(employeeId: string, device?: string): Promise<CheckInLog>;
  updateCheckOut(employeeId: string): Promise<CheckInLog | undefined>;
  getActiveCheckIns(): Promise<CheckInLog[]>;
  
  // Event logging
  logEvent(type: string, detail: any): Promise<EventLog>;
  getRecentEvents(limit?: number): Promise<EventLog[]>;
}

export class MemStorage implements IStorage {
  private employees: Map<string, Employee>;
  private tasks: Map<string, Task>;
  private taskAssignments: Map<string, TaskAssignment>;
  private inventoryItems: Map<string, InventoryItem>;
  private checkInLogs: Map<string, CheckInLog>;
  private eventLogs: EventLog[];

  constructor() {
    this.employees = new Map();
    this.tasks = new Map();
    this.taskAssignments = new Map();
    this.inventoryItems = new Map();
    this.checkInLogs = new Map();
    this.eventLogs = [];
    
    // Initialize with demo data
    this.initializeDemoData();
  }
  
  private async initializeDemoData() {
    // Create demo employees
    const adminEmployee: Employee = {
      id: randomUUID(),
      name: "Store Manager",
      pin: "1234", // In real app, this would be hashed
      role: "admin",
      active: true,
      createdAt: new Date()
    };
    
    const shiftLead: Employee = {
      id: randomUUID(),
      name: "Sarah Johnson",
      pin: "5678",
      role: "shift_lead", 
      active: true,
      createdAt: new Date()
    };
    
    const employee: Employee = {
      id: randomUUID(),
      name: "Mike Chen",
      pin: "9999",
      role: "employee",
      active: true,
      createdAt: new Date()
    };
    
    this.employees.set(adminEmployee.id, adminEmployee);
    this.employees.set(shiftLead.id, shiftLead);
    this.employees.set(employee.id, employee);
    
    // Create demo tasks
    const tasks = [
      { title: "Check cigarette inventory", frequency: 120, category: "inventory" },
      { title: "Clean restrooms", frequency: 90, category: "cleaning" },
      { title: "Restock coffee station", frequency: 60, category: "customer_service" },
      { title: "Check cooler temperatures", frequency: 180, category: "maintenance" },
      { title: "Update price signs", frequency: -1, category: "daily" }
    ];
    
    tasks.forEach(taskData => {
      const task: Task = {
        id: randomUUID(),
        ...taskData,
        active: true
      };
      this.tasks.set(task.id, task);
    });
    
    // Create demo inventory items
    const inventoryItems = [
      { sku: "CIG-001", name: "Marlboro Red", count: 15, minThreshold: 10 },
      { sku: "CIG-002", name: "Camel Blue", count: 8, minThreshold: 5 },
      { sku: "CIG-003", name: "Newport Menthol", count: 3, minThreshold: 5 },
      { sku: "MISC-001", name: "Lottery Tickets", count: 50, minThreshold: 20 }
    ];
    
    inventoryItems.forEach(itemData => {
      const item: InventoryItem = {
        id: randomUUID(),
        ...itemData,
        lastCountTs: new Date()
      };
      this.inventoryItems.set(item.id, item);
    });
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByPin(pin: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      (employee) => employee.pin === pin && employee.active,
    );
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = { 
      ...insertEmployee, 
      id,
      createdAt: new Date()
    };
    this.employees.set(id, employee);
    return employee;
  }
  
  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updated = { ...employee, ...updates };
    this.employees.set(id, updated);
    return updated;
  }
  
  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(e => e.active);
  }
  
  // Task methods
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }
  
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.active);
  }
  
  async getActiveTaskAssignments(): Promise<TaskAssignment[]> {
    return Array.from(this.taskAssignments.values())
      .filter(ta => ta.status === 'pending')
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  }
  
  async createTaskAssignment(insertAssignment: InsertTaskAssignment): Promise<TaskAssignment> {
    const id = randomUUID();
    const assignment: TaskAssignment = {
      ...insertAssignment,
      id,
      assignedAt: new Date(),
      completedAt: null
    };
    this.taskAssignments.set(id, assignment);
    return assignment;
  }
  
  async updateTaskAssignment(id: string, updates: Partial<TaskAssignment>): Promise<TaskAssignment | undefined> {
    const assignment = this.taskAssignments.get(id);
    if (!assignment) return undefined;
    
    const updated = { ...assignment, ...updates };
    this.taskAssignments.set(id, updated);
    return updated;
  }
  
  // Inventory methods
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }
  
  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;
    
    const updated = { ...item, ...updates };
    this.inventoryItems.set(id, updated);
    return updated;
  }
  
  // Check-in methods
  async createCheckIn(employeeId: string, device = "dashboard"): Promise<CheckInLog> {
    const id = randomUUID();
    const checkIn: CheckInLog = {
      id,
      employeeId,
      tsIn: new Date(),
      tsOut: null,
      device
    };
    this.checkInLogs.set(id, checkIn);
    return checkIn;
  }
  
  async updateCheckOut(employeeId: string): Promise<CheckInLog | undefined> {
    const activeCheckIn = Array.from(this.checkInLogs.values())
      .find(log => log.employeeId === employeeId && !log.tsOut);
      
    if (!activeCheckIn) return undefined;
    
    const updated = { ...activeCheckIn, tsOut: new Date() };
    this.checkInLogs.set(activeCheckIn.id, updated);
    return updated;
  }
  
  async getActiveCheckIns(): Promise<CheckInLog[]> {
    return Array.from(this.checkInLogs.values())
      .filter(log => !log.tsOut);
  }
  
  // Event logging
  async logEvent(type: string, detail: any): Promise<EventLog> {
    const event: EventLog = {
      id: randomUUID(),
      type,
      detail,
      ts: new Date()
    };
    this.eventLogs.push(event);
    // Keep only last 1000 events
    if (this.eventLogs.length > 1000) {
      this.eventLogs = this.eventLogs.slice(-1000);
    }
    return event;
  }
  
  async getRecentEvents(limit = 50): Promise<EventLog[]> {
    return this.eventLogs
      .sort((a, b) => b.ts.getTime() - a.ts.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
