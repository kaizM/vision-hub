import type { IStorage } from './storage';
import type { InsertTaskLog } from '../shared/schema';

export class TaskScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private employeeRotationIndex = 0; // Round-robin counter

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  start() {
    if (this.isRunning) {
      console.log('Task scheduler is already running');
      return;
    }

    console.log('Starting task scheduler with 1-minute intervals...');
    this.isRunning = true;
    
    // Run immediately once on start
    this.processRegularTasks();
    
    // Then run every minute (60,000ms)
    this.intervalId = setInterval(() => {
      this.processRegularTasks();
    }, 60000); // 1 minute
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Task scheduler stopped');
  }

  private async processRegularTasks() {
    try {
      console.log('[SCHEDULER] Processing regular tasks...');
      
      // Get all active regular tasks
      const regularTasks = await this.storage.getAllTasksRegular();
      const activeRegularTasks = regularTasks.filter(task => task.active);
      
      if (activeRegularTasks.length === 0) {
        console.log('[SCHEDULER] No active regular tasks found');
        return;
      }

      // Get active employees for round-robin assignment (include managers for personal task assignment)
      const allEmployees = await this.storage.getAllEmployees();
      const activeEmployees = allEmployees.filter(emp => 
        emp.active && emp.role?.toLowerCase() !== 'admin' // Include managers but exclude admins
      );

      if (activeEmployees.length === 0) {
        console.log('[SCHEDULER] No active non-manager employees found for task assignment');
        return;
      }

      const now = new Date();
      let tasksSpawned = 0;

      for (const regularTask of activeRegularTasks) {
        const isDue = await this.isTaskDue(regularTask);
        
        if (isDue) {
          // Assign to next employee in round-robin
          const assignedEmployee = this.getNextEmployee(activeEmployees);
          
          // Create task log entry
          const dueAt = new Date(now.getTime() + (30 * 60 * 1000)); // Due in 30 minutes
          
          const taskLog: InsertTaskLog = {
            sourceType: 'regular',
            sourceId: regularTask.id,
            assignedTo: assignedEmployee.id,
            status: 'pending',
            titleSnapshot: regularTask.title,
            dueAt: dueAt
          };

          const createdTaskLog = await this.storage.createTaskLog(taskLog);
          
          // Log the event for audit trail
          await this.storage.logEvent('task:new', {
            taskLogId: createdTaskLog.id,
            sourceType: 'regular',
            sourceId: regularTask.id,
            assignedTo: assignedEmployee.id,
            employeeName: assignedEmployee.name,
            title: regularTask.title,
            dueAt: dueAt,
            timestamp: now
          });

          console.log(`[SCHEDULER] Spawned task "${regularTask.title}" for ${assignedEmployee.name} (due: ${dueAt.toLocaleTimeString()})`);
          tasksSpawned++;
        }
      }

      if (tasksSpawned > 0) {
        console.log(`[SCHEDULER] Successfully spawned ${tasksSpawned} new tasks`);
      } else {
        console.log('[SCHEDULER] No tasks were due for spawning');
      }
      
    } catch (error) {
      console.error('[SCHEDULER] Error processing regular tasks:', error);
    }
  }

  private async isTaskDue(regularTask: any): Promise<boolean> {
    try {
      // Get ALL task logs for this regular task (not just pending ones)
      // We need to check the most recent log regardless of status to properly track frequency
      const allTaskLogs = await this.storage.getAllTaskLogs();
      const taskLogsForThisRegular = allTaskLogs.filter((log: any) => 
        log.sourceType === 'regular' && log.sourceId === regularTask.id
      );

      // Sort by creation time to get the most recent
      taskLogsForThisRegular.sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      const lastTaskLog = taskLogsForThisRegular[0];
      const now = new Date();

      if (!lastTaskLog) {
        // No previous task log exists, so it's due
        console.log(`[SCHEDULER] Task "${regularTask.title}" is due (never spawned)`);
        return true;
      }

      // Check if enough time has passed since the last spawn
      const lastSpawnTime = lastTaskLog.createdAt ? new Date(lastTaskLog.createdAt) : new Date(0);
      const timeSinceLastSpawn = now.getTime() - lastSpawnTime.getTime();
      const frequencyMs = regularTask.frequencyMinutes * 60 * 1000;

      const isDue = timeSinceLastSpawn >= frequencyMs;
      
      if (isDue) {
        console.log(`[SCHEDULER] Task "${regularTask.title}" is due (${Math.round(timeSinceLastSpawn / 60000)} minutes since last spawn, frequency: ${regularTask.frequencyMinutes} minutes)`);
      }
      
      return isDue;
    } catch (error) {
      console.error(`[SCHEDULER] Error checking if task "${regularTask.title}" is due:`, error);
      return false;
    }
  }

  private getNextEmployee(activeEmployees: any[]): any {
    // Simple round-robin assignment
    const employee = activeEmployees[this.employeeRotationIndex % activeEmployees.length];
    this.employeeRotationIndex++;
    
    // Reset counter to prevent overflow
    if (this.employeeRotationIndex >= activeEmployees.length * 1000) {
      this.employeeRotationIndex = 0;
    }
    
    return employee;
  }

  // Public method to get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      rotationIndex: this.employeeRotationIndex,
      uptime: this.isRunning ? 'Running' : 'Stopped'
    };
  }

  // Force run for testing/debugging
  async forceRun() {
    if (!this.isRunning) {
      console.log('[SCHEDULER] Force running task processing (scheduler not started)');
    }
    await this.processRegularTasks();
  }
}