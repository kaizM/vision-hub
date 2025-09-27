import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Employee management
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  pin: text("pin").notNull(), // hashed PIN
  role: text("role").notNull().default("employee"), // employee, shift_lead, admin
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Check-in/out logs
export const checkInLogs = pgTable("check_in_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  tsIn: timestamp("ts_in").defaultNow(),
  tsOut: timestamp("ts_out"),
  device: text("device").default("dashboard"),
});

// Task definitions
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  frequency: integer("frequency").notNull(), // minutes for rotation, -1 for daily
  category: text("category").default("general"),
  active: boolean("active").notNull().default(true),
});

// Task assignments
export const taskAssignments = pgTable("task_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueAt: timestamp("due_at").notNull(),
  assignedTo: varchar("assigned_to").references(() => employees.id),
  status: text("status").notNull().default("pending"), // pending, done, missed
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

// Inventory items
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  count: integer("count").notNull().default(0),
  minThreshold: integer("min_threshold").notNull().default(5),
  lastCountTs: timestamp("last_count_ts").defaultNow(),
});

// Inventory logs
export const inventoryLogs = pgTable("inventory_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => inventoryItems.id),
  delta: integer("delta").notNull(), // +/- change
  reason: text("reason").notNull(), // delivery, shrinkage, adjustment, sale
  ts: timestamp("ts").defaultNow(),
  byEmployee: varchar("by_employee").references(() => employees.id),
});

// Event logs
export const eventLogs = pgTable("event_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // alert, checkin, face, plate, inventory, task
  detail: jsonb("detail").notNull(),
  ts: timestamp("ts").defaultNow(),
});

// Banned faces (optional feature)
export const bannedFaces = pgTable("banned_faces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(),
  imagePath: text("image_path").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Banned plates (optional feature)
export const bannedPlates = pgTable("banned_plates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plateText: text("plate_text").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  lastCountTs: true,
});

export const insertInventoryLogSchema = createInsertSchema(inventoryLogs).omit({
  id: true,
  ts: true,
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type CheckInLog = typeof checkInLogs.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type EventLog = typeof eventLogs.$inferSelect;
export type BannedFace = typeof bannedFaces.$inferSelect;
export type BannedPlate = typeof bannedPlates.$inferSelect;

// Legacy types for compatibility
export type User = Employee;
export type InsertUser = InsertEmployee;
