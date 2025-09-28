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

// Task Scheduling System (Phase 2) - Regular recurring tasks (templates)
export const tasksRegular = pgTable("tasks_regular", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  frequencyMinutes: integer("frequency_minutes").notNull().default(90),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Special one-off tasks
export const tasksSpecial = pgTable("tasks_special", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  assignedTo: varchar("assigned_to").references(() => employees.id),
  status: text("status").notNull().default("pending"), // pending, done, missed, help
  createdAt: timestamp("created_at").defaultNow(),
  dueAt: timestamp("due_at"),
});

// Task logs - ledger of all actual tasks created from regular or special templates
export const taskLogs = pgTable("task_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceType: text("source_type").notNull(), // regular, special
  sourceId: varchar("source_id").notNull(),
  assignedTo: varchar("assigned_to").references(() => employees.id),
  status: text("status").notNull().default("pending"), // pending, done, missed, help
  titleSnapshot: text("title_snapshot").notNull(), // frozen text in case original is edited
  createdAt: timestamp("created_at").defaultNow(),
  dueAt: timestamp("due_at").notNull(),
  completedAt: timestamp("completed_at"),
});

// Legacy task tables (keeping for backward compatibility during transition)
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  frequency: integer("frequency").notNull(), // minutes for rotation, -1 for daily
  category: text("category").default("general"),
  active: boolean("active").notNull().default(true),
});

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

// Carton Inventory System - dedicated carton tracking ledger
export const cartonLedger = pgTable("carton_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employee: text("employee").notNull(), // employee name who made the change
  action: text("action").notNull(), // add, remove, set, reset
  amount: integer("amount"), // not required for reset
  delta: integer("delta").notNull(), // calculated change (+/-)
  totalAfter: integer("total_after").notNull(),
  note: text("note"), // optional, max 120 chars
  timestamp: timestamp("timestamp").defaultNow(),
});

// Quick Shortcuts (QS tiles) for external website links
export const shortcuts = pgTable("shortcuts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  icon: text("icon"), // optional icon/emoji
  category: text("category"), // optional grouping
  visible: boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Temperature monitoring equipment
export const temperatureEquipment = pgTable("temperature_equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Beer Walk-in", "Kitchen Freezer"
  minTemp: integer("min_temp").notNull(), // in Fahrenheit
  maxTemp: integer("max_temp").notNull(), // in Fahrenheit
  intervalHours: integer("interval_hours").notNull().default(14),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Temperature readings
export const temperatureReadings = pgTable("temperature_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentId: varchar("equipment_id").notNull().references(() => temperatureEquipment.id),
  value: integer("value").notNull(), // temperature in Fahrenheit
  status: text("status").notNull(), // ok, high, low
  takenBy: varchar("taken_by").notNull().references(() => employees.id),
  takenAt: timestamp("taken_at").defaultNow(),
});

// Messages system (broadcast and direct)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // broadcast, direct
  recipientId: varchar("recipient_id").references(() => employees.id), // null for broadcast
  senderId: varchar("sender_id").notNull().references(() => employees.id),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// System settings
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Camera configuration 
export const cameras = pgTable("cameras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  rtspUrl: text("rtsp_url"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

// Task scheduling schemas  
export const insertTaskRegularSchema = createInsertSchema(tasksRegular).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSpecialSchema = createInsertSchema(tasksSpecial).omit({
  id: true,
  createdAt: true,
});

export const insertTaskLogSchema = createInsertSchema(taskLogs).omit({
  id: true,
  createdAt: true,
});

// Carton inventory schemas
export const insertCartonLedgerSchema = createInsertSchema(cartonLedger).omit({
  id: true,
  timestamp: true,
  delta: true,
  totalAfter: true,
}).extend({
  amount: z.number().optional() // Allow amount field for frontend compatibility
});

// Quick shortcuts schemas
export const insertShortcutSchema = createInsertSchema(shortcuts).omit({
  id: true,
  createdAt: true,
});

// Temperature schemas
export const insertTemperatureEquipmentSchema = createInsertSchema(temperatureEquipment).omit({
  id: true,
  createdAt: true,
});

export const insertTemperatureReadingSchema = createInsertSchema(temperatureReadings).omit({
  id: true,
  takenAt: true,
});

// Message schemas
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
});

// Settings schemas
export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Camera schemas
export const insertCameraSchema = createInsertSchema(cameras).omit({
  id: true,
  createdAt: true,
});

// Vision schemas
export const insertBannedFaceSchema = createInsertSchema(bannedFaces).omit({
  id: true,
  addedAt: true,
});

export const insertBannedPlateSchema = createInsertSchema(bannedPlates).omit({
  id: true,
  addedAt: true,
});

// Legacy schemas (keeping for backward compatibility)
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

// Vision types
export type BannedFace = typeof bannedFaces.$inferSelect;
export type InsertBannedFace = z.infer<typeof insertBannedFaceSchema>;
export type BannedPlate = typeof bannedPlates.$inferSelect;
export type InsertBannedPlate = z.infer<typeof insertBannedPlateSchema>;

// Task Scheduling System types
export type TaskRegular = typeof tasksRegular.$inferSelect;
export type InsertTaskRegular = z.infer<typeof insertTaskRegularSchema>;
export type TaskSpecial = typeof tasksSpecial.$inferSelect;
export type InsertTaskSpecial = z.infer<typeof insertTaskSpecialSchema>;
export type TaskLog = typeof taskLogs.$inferSelect;
export type InsertTaskLog = z.infer<typeof insertTaskLogSchema>;

// Carton inventory types
export type CartonLedger = typeof cartonLedger.$inferSelect;
export type InsertCartonLedger = z.infer<typeof insertCartonLedgerSchema>;

// Quick shortcuts types
export type Shortcut = typeof shortcuts.$inferSelect;
export type InsertShortcut = z.infer<typeof insertShortcutSchema>;

// Temperature types
export type TemperatureEquipment = typeof temperatureEquipment.$inferSelect;
export type InsertTemperatureEquipment = z.infer<typeof insertTemperatureEquipmentSchema>;
export type TemperatureReading = typeof temperatureReadings.$inferSelect;
export type InsertTemperatureReading = z.infer<typeof insertTemperatureReadingSchema>;

// Message types
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Settings types
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Camera types
export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;

// Other types
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryLog = typeof inventoryLogs.$inferSelect;
export type InsertInventoryLog = z.infer<typeof insertInventoryLogSchema>;
export type EventLog = typeof eventLogs.$inferSelect;

// Legacy types (keeping for backward compatibility)
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;
export type User = Employee;
export type InsertUser = InsertEmployee;
