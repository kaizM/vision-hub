import { 
  type Employee, 
  type InsertEmployee,
  type Task,
  type InsertTask,
  type TaskAssignment,
  type InsertTaskAssignment,
  type TaskRegular,
  type InsertTaskRegular,
  type TaskSpecial,
  type InsertTaskSpecial,
  type TaskLog,
  type InsertTaskLog,
  type CartonLedger,
  type InsertCartonLedger,
  type Shortcut,
  type InsertShortcut,
  type TemperatureEquipment,
  type InsertTemperatureEquipment,
  type TemperatureReading,
  type InsertTemperatureReading,
  type Message,
  type InsertMessage,
  type Setting,
  type InsertSetting,
  type Camera,
  type InsertCamera,
  type InventoryItem,
  type InsertInventoryItem,
  type CheckInLog,
  type EventLog
} from "@shared/schema";
import { randomUUID } from "crypto";

// Lemur Express Central Hub storage interface
export interface IStorage {
  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByPin(pin: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  
  // Task Scheduling System (Phase 2)
  // Regular tasks (templates)
  createTaskRegular(task: InsertTaskRegular): Promise<TaskRegular>;
  getAllTasksRegular(): Promise<TaskRegular[]>;
  updateTaskRegular(id: string, updates: Partial<TaskRegular>): Promise<TaskRegular | undefined>;
  deleteTaskRegular(id: string): Promise<boolean>;
  
  // Special tasks (one-off)
  createTaskSpecial(task: InsertTaskSpecial): Promise<TaskSpecial>;
  getAllTasksSpecial(): Promise<TaskSpecial[]>;
  updateTaskSpecial(id: string, updates: Partial<TaskSpecial>): Promise<TaskSpecial | undefined>;
  
  // Task logs (actual instances)
  createTaskLog(taskLog: InsertTaskLog): Promise<TaskLog>;
  getTaskLogsByEmployee(employeeId: string): Promise<TaskLog[]>;
  getPendingTaskLogs(): Promise<TaskLog[]>;
  updateTaskLog(id: string, updates: Partial<TaskLog>): Promise<TaskLog | undefined>;
  getOverdueTaskLogs(): Promise<TaskLog[]>;
  
  // Carton Inventory System
  getCartonTotal(): Promise<number>;
  addCartonEntry(entry: InsertCartonLedger): Promise<CartonLedger>;
  getCartonLedger(limit?: number): Promise<CartonLedger[]>;
  getLastCartonEntry(): Promise<CartonLedger | undefined>;
  removeLastCartonEntry(): Promise<boolean>; // for undo functionality
  
  // Quick Shortcuts (QS tiles)
  createShortcut(shortcut: InsertShortcut): Promise<Shortcut>;
  getAllShortcuts(): Promise<Shortcut[]>;
  getVisibleShortcuts(): Promise<Shortcut[]>;
  updateShortcut(id: string, updates: Partial<Shortcut>): Promise<Shortcut | undefined>;
  deleteShortcut(id: string): Promise<boolean>;
  reorderShortcuts(shortcuts: {id: string, sortOrder: number}[]): Promise<boolean>;
  
  // Temperature monitoring
  createTemperatureEquipment(equipment: InsertTemperatureEquipment): Promise<TemperatureEquipment>;
  getAllTemperatureEquipment(): Promise<TemperatureEquipment[]>;
  getActiveTemperatureEquipment(): Promise<TemperatureEquipment[]>;
  updateTemperatureEquipment(id: string, updates: Partial<TemperatureEquipment>): Promise<TemperatureEquipment | undefined>;
  deleteTemperatureEquipment(id: string): Promise<boolean>;
  
  addTemperatureReading(reading: InsertTemperatureReading): Promise<TemperatureReading>;
  getTemperatureReadings(equipmentId?: string, limit?: number): Promise<TemperatureReading[]>;
  getLastTemperatureReading(equipmentId: string): Promise<TemperatureReading | undefined>;
  
  // Messages system
  sendMessage(message: InsertMessage): Promise<Message>;
  getMessages(recipientId?: string, limit?: number): Promise<Message[]>;
  markMessageRead(messageId: string): Promise<Message | undefined>;
  getBroadcastMessages(limit?: number): Promise<Message[]>;
  
  // Settings management
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
  
  // Camera management
  createCamera(camera: InsertCamera): Promise<Camera>;
  getAllCameras(): Promise<Camera[]>;
  getActiveCameras(): Promise<Camera[]>;
  updateCamera(id: string, updates: Partial<Camera>): Promise<Camera | undefined>;
  deleteCamera(id: string): Promise<boolean>;
  
  // Legacy task methods (keeping for backward compatibility)
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
  private tasks: Map<string, Task>; // Legacy
  private taskAssignments: Map<string, TaskAssignment>; // Legacy
  private inventoryItems: Map<string, InventoryItem>;
  private checkInLogs: Map<string, CheckInLog>;
  private eventLogs: EventLog[];
  
  // New comprehensive system storage
  private tasksRegular: Map<string, TaskRegular>;
  private tasksSpecial: Map<string, TaskSpecial>;
  private taskLogs: Map<string, TaskLog>;
  private cartonLedger: CartonLedger[];
  private cartonTotal: number;
  private shortcuts: Map<string, Shortcut>;
  private temperatureEquipment: Map<string, TemperatureEquipment>;
  private temperatureReadings: Map<string, TemperatureReading>;
  private messages: Map<string, Message>;
  private settings: Map<string, Setting>;
  private cameras: Map<string, Camera>;

  constructor() {
    this.employees = new Map();
    this.tasks = new Map(); // Legacy
    this.taskAssignments = new Map(); // Legacy
    this.inventoryItems = new Map();
    this.checkInLogs = new Map();
    this.eventLogs = [];
    
    // New comprehensive system initialization
    this.tasksRegular = new Map();
    this.tasksSpecial = new Map();
    this.taskLogs = new Map();
    this.cartonLedger = [];
    this.cartonTotal = 0;
    this.shortcuts = new Map();
    this.temperatureEquipment = new Map();
    this.temperatureReadings = new Map();
    this.messages = new Map();
    this.settings = new Map();
    this.cameras = new Map();
    
    // Initialize with demo data
    this.initializeDemoData();
  }
  
  private async initializeDemoData() {
    // Set default system settings
    await this.setSetting('manager_pin', '786110'); // Lemur Express Manager PIN
    await this.setSetting('chime_interval', '10'); // seconds
    await this.setSetting('tts_repeats', '3');
    await this.setSetting('personal_tab_timeout', '120'); // seconds
    await this.setSetting('task_grace_window', '30'); // minutes
    await this.setSetting('temp_default_interval', '14'); // hours
    await this.setSetting('store_name', 'Lemur Express Central Hub');
    
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
    
    // Initialize Phase 2 Task Scheduling System
    const regularTasks = [
      { title: "Check cigarette inventory", frequencyMinutes: 120 },
      { title: "Clean restrooms", frequencyMinutes: 90 },
      { title: "Restock coffee station", frequencyMinutes: 60 },
      { title: "Check cooler temperatures", frequencyMinutes: 180 },
      { title: "Update price signs", frequencyMinutes: 480 }
    ];
    
    regularTasks.forEach(taskData => {
      const task: TaskRegular = {
        id: randomUUID(),
        ...taskData,
        active: true,
        createdAt: new Date()
      };
      this.tasksRegular.set(task.id, task);
    });
    
    // Initialize carton inventory with starting total
    this.cartonTotal = 150;
    const initialCartonEntry: CartonLedger = {
      id: randomUUID(),
      employee: "System",
      action: "set",
      amount: 150,
      delta: 150,
      totalAfter: 150,
      note: "Initial inventory count",
      timestamp: new Date()
    };
    this.cartonLedger.push(initialCartonEntry);
    
    // Create demo shortcuts
    const shortcuts = [
      { name: "Lottery Scanner", url: "https://lottery.example.com", icon: "🎰", category: "vendor", visible: true, sortOrder: 0 },
      { name: "Vendor Portal", url: "https://vendor.example.com", icon: "📦", category: "vendor", visible: true, sortOrder: 1 },
      { name: "Store Reports", url: "https://reports.example.com", icon: "📊", category: "admin", visible: true, sortOrder: 2 }
    ];
    
    shortcuts.forEach(shortcutData => {
      const shortcut: Shortcut = {
        id: randomUUID(),
        ...shortcutData,
        createdAt: new Date()
      };
      this.shortcuts.set(shortcut.id, shortcut);
    });
    
    // Create demo temperature equipment
    const tempEquipment = [
      { name: "Beer Walk-in Cooler", minTemp: 36, maxTemp: 40, intervalHours: 12 },
      { name: "Grocery Freezer", minTemp: -5, maxTemp: 5, intervalHours: 14 },
      { name: "Kitchen Refrigerator", minTemp: 35, maxTemp: 38, intervalHours: 16 },
      { name: "Ice Cream Freezer", minTemp: -10, maxTemp: 0, intervalHours: 8 }
    ];
    
    tempEquipment.forEach(equipData => {
      const equipment: TemperatureEquipment = {
        id: randomUUID(),
        ...equipData,
        active: true,
        createdAt: new Date()
      };
      this.temperatureEquipment.set(equipment.id, equipment);
    });
    
    // Create demo cameras
    const cameras = [
      { name: "Front Door", rtspUrl: "rtsp://192.168.1.100:554/live", enabled: true },
      { name: "Register Area", rtspUrl: "rtsp://192.168.1.101:554/live", enabled: true },
      { name: "Back Storage", rtspUrl: "rtsp://192.168.1.102:554/live", enabled: false }
    ];
    
    cameras.forEach(cameraData => {
      const camera: Camera = {
        id: randomUUID(),
        ...cameraData,
        createdAt: new Date()
      };
      this.cameras.set(camera.id, camera);
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
  
  // Task Scheduling System (Phase 2) Implementation
  
  // Regular tasks (templates)
  async createTaskRegular(insertTask: InsertTaskRegular): Promise<TaskRegular> {
    const id = randomUUID();
    const task: TaskRegular = { ...insertTask, id, createdAt: new Date() };
    this.tasksRegular.set(id, task);
    return task;
  }

  async getAllTasksRegular(): Promise<TaskRegular[]> {
    return Array.from(this.tasksRegular.values()).filter(t => t.active);
  }

  async updateTaskRegular(id: string, updates: Partial<TaskRegular>): Promise<TaskRegular | undefined> {
    const task = this.tasksRegular.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...updates };
    this.tasksRegular.set(id, updated);
    return updated;
  }

  async deleteTaskRegular(id: string): Promise<boolean> {
    return this.tasksRegular.delete(id);
  }

  // Special tasks (one-off)
  async createTaskSpecial(insertTask: InsertTaskSpecial): Promise<TaskSpecial> {
    const id = randomUUID();
    const task: TaskSpecial = { ...insertTask, id, createdAt: new Date() };
    this.tasksSpecial.set(id, task);
    return task;
  }

  async getAllTasksSpecial(): Promise<TaskSpecial[]> {
    return Array.from(this.tasksSpecial.values());
  }

  async updateTaskSpecial(id: string, updates: Partial<TaskSpecial>): Promise<TaskSpecial | undefined> {
    const task = this.tasksSpecial.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...updates };
    this.tasksSpecial.set(id, updated);
    return updated;
  }

  // Task logs (actual instances)
  async createTaskLog(insertTaskLog: InsertTaskLog): Promise<TaskLog> {
    const id = randomUUID();
    const taskLog: TaskLog = { 
      ...insertTaskLog, 
      id, 
      createdAt: new Date(),
      completedAt: null 
    };
    this.taskLogs.set(id, taskLog);
    return taskLog;
  }

  async getTaskLogsByEmployee(employeeId: string): Promise<TaskLog[]> {
    return Array.from(this.taskLogs.values())
      .filter(tl => tl.assignedTo === employeeId && tl.status === 'pending')
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  }

  async getPendingTaskLogs(): Promise<TaskLog[]> {
    return Array.from(this.taskLogs.values())
      .filter(tl => tl.status === 'pending')
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  }

  async updateTaskLog(id: string, updates: Partial<TaskLog>): Promise<TaskLog | undefined> {
    const taskLog = this.taskLogs.get(id);
    if (!taskLog) return undefined;
    
    const updated = { ...taskLog, ...updates };
    if (updates.status === 'done' && !updated.completedAt) {
      updated.completedAt = new Date();
    }
    this.taskLogs.set(id, updated);
    return updated;
  }

  async getOverdueTaskLogs(): Promise<TaskLog[]> {
    const now = new Date();
    return Array.from(this.taskLogs.values())
      .filter(tl => tl.status === 'pending' && tl.dueAt < now);
  }

  // Carton Inventory System
  async getCartonTotal(): Promise<number> {
    return this.cartonTotal;
  }

  async addCartonEntry(insertEntry: InsertCartonLedger): Promise<CartonLedger> {
    const id = randomUUID();
    
    // Calculate new total based on action and current total
    let newTotal = this.cartonTotal;
    let delta = insertEntry.delta;
    
    switch (insertEntry.action) {
      case 'add':
        newTotal = this.cartonTotal + (insertEntry.amount || 0);
        delta = insertEntry.amount || 0;
        break;
      case 'remove':
        newTotal = Math.max(0, this.cartonTotal - (insertEntry.amount || 0));
        delta = -(insertEntry.amount || 0);
        break;
      case 'set':
        delta = (insertEntry.amount || 0) - this.cartonTotal;
        newTotal = insertEntry.amount || 0;
        break;
      case 'reset':
        delta = -this.cartonTotal;
        newTotal = 0;
        break;
    }
    
    const entry: CartonLedger = {
      ...insertEntry,
      id,
      delta,
      totalAfter: newTotal,
      timestamp: new Date()
    };
    
    this.cartonLedger.push(entry);
    this.cartonTotal = newTotal;
    return entry;
  }

  async getCartonLedger(limit = 100): Promise<CartonLedger[]> {
    return this.cartonLedger
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getLastCartonEntry(): Promise<CartonLedger | undefined> {
    if (this.cartonLedger.length === 0) return undefined;
    return this.cartonLedger[this.cartonLedger.length - 1];
  }

  async removeLastCartonEntry(): Promise<boolean> {
    if (this.cartonLedger.length === 0) return false;
    
    const lastEntry = this.cartonLedger.pop();
    if (!lastEntry) return false;
    
    // Restore the previous total
    if (this.cartonLedger.length > 0) {
      const previousEntry = this.cartonLedger[this.cartonLedger.length - 1];
      this.cartonTotal = previousEntry.totalAfter;
    } else {
      this.cartonTotal = 0;
    }
    
    return true;
  }

  // Quick Shortcuts (QS tiles)
  async createShortcut(insertShortcut: InsertShortcut): Promise<Shortcut> {
    const id = randomUUID();
    const shortcut: Shortcut = { ...insertShortcut, id, createdAt: new Date() };
    this.shortcuts.set(id, shortcut);
    return shortcut;
  }

  async getAllShortcuts(): Promise<Shortcut[]> {
    return Array.from(this.shortcuts.values())
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getVisibleShortcuts(): Promise<Shortcut[]> {
    return Array.from(this.shortcuts.values())
      .filter(s => s.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async updateShortcut(id: string, updates: Partial<Shortcut>): Promise<Shortcut | undefined> {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return undefined;
    const updated = { ...shortcut, ...updates };
    this.shortcuts.set(id, updated);
    return updated;
  }

  async deleteShortcut(id: string): Promise<boolean> {
    return this.shortcuts.delete(id);
  }

  async reorderShortcuts(shortcuts: {id: string, sortOrder: number}[]): Promise<boolean> {
    for (const update of shortcuts) {
      const shortcut = this.shortcuts.get(update.id);
      if (shortcut) {
        shortcut.sortOrder = update.sortOrder;
        this.shortcuts.set(update.id, shortcut);
      }
    }
    return true;
  }

  // Temperature monitoring
  async createTemperatureEquipment(insertEquipment: InsertTemperatureEquipment): Promise<TemperatureEquipment> {
    const id = randomUUID();
    const equipment: TemperatureEquipment = { ...insertEquipment, id, createdAt: new Date() };
    this.temperatureEquipment.set(id, equipment);
    return equipment;
  }

  async getAllTemperatureEquipment(): Promise<TemperatureEquipment[]> {
    return Array.from(this.temperatureEquipment.values());
  }

  async getActiveTemperatureEquipment(): Promise<TemperatureEquipment[]> {
    return Array.from(this.temperatureEquipment.values()).filter(e => e.active);
  }

  async updateTemperatureEquipment(id: string, updates: Partial<TemperatureEquipment>): Promise<TemperatureEquipment | undefined> {
    const equipment = this.temperatureEquipment.get(id);
    if (!equipment) return undefined;
    const updated = { ...equipment, ...updates };
    this.temperatureEquipment.set(id, updated);
    return updated;
  }

  async deleteTemperatureEquipment(id: string): Promise<boolean> {
    return this.temperatureEquipment.delete(id);
  }

  async addTemperatureReading(insertReading: InsertTemperatureReading): Promise<TemperatureReading> {
    const id = randomUUID();
    const reading: TemperatureReading = { ...insertReading, id, takenAt: new Date() };
    this.temperatureReadings.set(id, reading);
    return reading;
  }

  async getTemperatureReadings(equipmentId?: string, limit = 100): Promise<TemperatureReading[]> {
    let readings = Array.from(this.temperatureReadings.values());
    if (equipmentId) {
      readings = readings.filter(r => r.equipmentId === equipmentId);
    }
    return readings
      .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())
      .slice(0, limit);
  }

  async getLastTemperatureReading(equipmentId: string): Promise<TemperatureReading | undefined> {
    return Array.from(this.temperatureReadings.values())
      .filter(r => r.equipmentId === equipmentId)
      .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime())[0];
  }

  // Messages system
  async sendMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id, 
      sentAt: new Date(),
      readAt: null
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(recipientId?: string, limit = 100): Promise<Message[]> {
    let messages = Array.from(this.messages.values());
    if (recipientId) {
      messages = messages.filter(m => m.recipientId === recipientId || m.type === 'broadcast');
    }
    return messages
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  async markMessageRead(messageId: string): Promise<Message | undefined> {
    const message = this.messages.get(messageId);
    if (!message) return undefined;
    const updated = { ...message, readAt: new Date() };
    this.messages.set(messageId, updated);
    return updated;
  }

  async getBroadcastMessages(limit = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.type === 'broadcast')
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  // Settings management
  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(s => s.key === key);
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = Array.from(this.settings.values()).find(s => s.key === key);
    if (existing) {
      existing.value = value;
      existing.updatedAt = new Date();
      this.settings.set(existing.id, existing);
      return existing;
    } else {
      const id = randomUUID();
      const setting: Setting = {
        id,
        key,
        value,
        updatedAt: new Date()
      };
      this.settings.set(id, setting);
      return setting;
    }
  }

  async getAllSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  // Camera management
  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const id = randomUUID();
    const camera: Camera = { ...insertCamera, id, createdAt: new Date() };
    this.cameras.set(id, camera);
    return camera;
  }

  async getAllCameras(): Promise<Camera[]> {
    return Array.from(this.cameras.values());
  }

  async getActiveCameras(): Promise<Camera[]> {
    return Array.from(this.cameras.values()).filter(c => c.enabled);
  }

  async updateCamera(id: string, updates: Partial<Camera>): Promise<Camera | undefined> {
    const camera = this.cameras.get(id);
    if (!camera) return undefined;
    const updated = { ...camera, ...updates };
    this.cameras.set(id, updated);
    return updated;
  }

  async deleteCamera(id: string): Promise<boolean> {
    return this.cameras.delete(id);
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
