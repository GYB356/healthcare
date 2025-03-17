import { 
  TimeEntry, 
  TimeTrackingSummary, 
  TimeTrackingSettings,
  BillableRate
} from '../models/types';
import TimeEntryRepository from '../repositories/timeEntryRepository';
import ProjectRepository from '../repositories/projectRepository';
import TaskRepository from '../repositories/taskRepository';
import { v4 as uuidv4 } from 'uuid';

// Custom error classes
class TimeEntryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TimeEntryError';
  }
}

class ValidationError extends TimeEntryError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

class ConcurrencyError extends TimeEntryError {
  constructor(message: string) {
    super(message, 'CONCURRENCY_ERROR');
  }
}

class DatabaseError extends TimeEntryError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR');
  }
}

interface TimeEntriesFilter {
  projectId?: string;
  taskId?: string;
  startDate?: Date;
  endDate?: Date;
  billable?: boolean;
  page: number;
  limit: number;
}

interface SummaryOptions {
  projectId?: string;
  taskId?: string;
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month' | 'project' | 'task';
}

export default class TimeEntryService {
  private timeEntryRepo: TimeEntryRepository;
  private projectRepo: ProjectRepository;
  private taskRepo: TaskRepository;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor() {
    this.timeEntryRepo = new TimeEntryRepository();
    this.projectRepo = new ProjectRepository();
    this.taskRepo = new TaskRepository();
  }

  // Retry wrapper function
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
        }
      }
    }
    
    throw lastError;
  }

  // Start a new timer with validation and retry
  public async startTimer(
    userId: string,
    taskId: string,
    description: string,
    billable: boolean = true,
    tags: string[] = []
  ): Promise<TimeEntry> {
    return this.withRetry(async () => {
      // Validate input
      if (!userId || !taskId) {
        throw new ValidationError('Missing required fields');
      }

      // Check if user has an active timer
      const activeTimer = await this.getCurrentTimer(userId);
      if (activeTimer) {
        throw new ValidationError('You already have an active timer running');
      }

      // Get task details
      const task = await this.taskRepo.getTaskById(taskId);
      if (!task) {
        throw new ValidationError('Task not found');
      }

      // Get billable rate
      const billableRate = await this.getBillableRate(userId, task.projectId);

      const timeEntry: TimeEntry = {
        id: uuidv4(),
        taskId,
        projectId: task.projectId,
        userId,
        description,
        startTime: new Date(),
        endTime: null,
        duration: 0,
        billable,
        invoiceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        billableRate: billableRate?.hourlyRate || null,
        tags,
        source: 'timer',
        version: 1
      };

      return this.timeEntryRepo.createTimeEntry(timeEntry);
    });
  }

  // Stop timer with validation and retry
  public async stopTimer(
    userId: string,
    timeEntryId: string,
    endTime: Date
  ): Promise<TimeEntry> {
    return this.withRetry(async () => {
      const timeEntry = await this.timeEntryRepo.getTimeEntryById(timeEntryId);
      
      if (!timeEntry) {
        throw new ValidationError('Time entry not found');
      }

      if (timeEntry.userId !== userId) {
        throw new ValidationError('You do not have permission to stop this timer');
      }

      if (timeEntry.endTime !== null) {
        throw new ValidationError('This timer is already stopped');
      }

      const durationSeconds = Math.floor((endTime.getTime() - timeEntry.startTime.getTime()) / 1000);
      const settings = await this.getUserSettings(userId);
      const roundedDuration = this.applyTimeRounding(durationSeconds, settings.roundingInterval);

      const updatedTimeEntry: Partial<TimeEntry> = {
        endTime,
        duration: roundedDuration,
        updatedAt: new Date(),
        version: timeEntry.version + 1
      };

      return this.timeEntryRepo.updateTimeEntry(timeEntryId, updatedTimeEntry);
    });
  }

  // Create manual entry with validation and retry
  public async createManualEntry(
    userId: string,
    taskId: string,
    projectId: string,
    description: string,
    startTime: Date,
    endTime: Date,
    duration: number | null,
    billable: boolean = true,
    billableRate: number | null = null,
    tags: string[] = []
  ): Promise<TimeEntry> {
    return this.withRetry(async () => {
      // Validate input
      if (!userId || !taskId || !projectId || !startTime || !endTime) {
        throw new ValidationError('Missing required fields');
      }

      if (endTime <= startTime) {
        throw new ValidationError('End time must be after start time');
      }

      // Validate task belongs to project
      const task = await this.taskRepo.getTaskById(taskId);
      if (!task || task.projectId !== projectId) {
        throw new ValidationError('Invalid task or project');
      }

      // Calculate duration if not provided
      let calculatedDuration = duration;
      if (!calculatedDuration) {
        calculatedDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      }

      // Apply rounding
      const settings = await this.getUserSettings(userId);
      const roundedDuration = this.applyTimeRounding(calculatedDuration, settings.roundingInterval);

      // Get billable rate if not provided
      let rate = billableRate;
      if (billable && rate === null) {
        const rateInfo = await this.getBillableRate(userId, projectId);
        rate = rateInfo?.hourlyRate || null;
      }

      const timeEntry: TimeEntry = {
        id: uuidv4(),
        taskId,
        projectId,
        userId,
        description,
        startTime,
        endTime,
        duration: roundedDuration,
        billable,
        invoiceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        billableRate: rate,
        tags,
        source: 'manual',
        version: 1
      };

      return this.timeEntryRepo.createTimeEntry(timeEntry);
    });
  }

  // Update an existing time entry
  public async updateTimeEntry(
    userId: string,
    timeEntryId: string,
    updateData: Partial<TimeEntry>
  ): Promise<TimeEntry> {
    const timeEntry = await this.timeEntryRepo.getTimeEntryById(timeEntryId);
    
    if (!timeEntry) {
      throw new Error('Time entry not found');
    }

    if (timeEntry.userId !== userId) {
      throw new Error('You do not have permission to update this time entry');
    }

    // If time entry is already invoiced, restrict updates
    if (timeEntry.invoiceId) {
      const allowedUpdates = ['description', 'tags'];
      const attemptedUpdates = Object.keys(updateData);
      
      const disallowedUpdates = attemptedUpdates.filter(
        key => !allowedUpdates.includes(key)
      );
      
      if (disallowedUpdates.length > 0) {
        throw new Error(`Cannot update ${disallowedUpdates.join(', ')} on an invoiced time entry`);
      }
    }

    // If updating start or end time, recalculate duration
    let updatedDuration = timeEntry.duration;
    if (updateData.startTime || updateData.endTime) {
      const start = updateData.startTime || timeEntry.startTime;
      const end = updateData.endTime || timeEntry.endTime;
      
      if (end) {
        updatedDuration = Math.floor((end.getTime() - start.getTime()) / 1000);
        if (updatedDuration <= 0) {
          throw new Error('End time must be after start time');
        }
        
        // Apply rounding if configured in user settings
        const settings = await this.getUserSettings(userId);
        updatedDuration = this.applyTimeRounding(updatedDuration, settings.roundingInterval);
      }
    }

    // Include calculated duration in the update
    const finalUpdate: Partial<TimeEntry> = {
      ...updateData,
      duration: updatedDuration,
      updatedAt: new Date()
    };

    return this.timeEntryRepo.updateTimeEntry(timeEntryId, finalUpdate);
  }

  // Delete a time entry
  public async deleteTimeEntry(
    userId: string,
    timeEntryId: string
  ): Promise<void> {
    const timeEntry = await this.timeEntryRepo.getTimeEntryById(timeEntryId);
    
    if (!timeEntry) {
      throw new Error('Time entry not found');
    }

    if (timeEntry.userId !== userId) {
      throw new Error('You do not have permission to delete this time entry');
    }

    // Prevent deletion of invoiced time entries
    if (timeEntry.invoiceId) {
      throw new Error('Cannot delete a time entry that has been invoiced');
    }

    await this.timeEntryRepo.deleteTimeEntry(timeEntryId);
  }

  // Get time entries for a user with filtering
  public async getUserTimeEntries(
    userId: string,
    filters: TimeEntriesFilter
  ): Promise<{ entries: TimeEntry[], total: number, page: number, limit: number }> {
    return this.timeEntryRepo.getUserTimeEntries(userId, filters);
  }

  // Get time tracking summary with grouping options
  public async getTimeSummary(
    userId: string,
    options: SummaryOptions
  ): Promise<TimeTrackingSummary[]> {
    const { startDate, endDate, projectId, taskId, groupBy } = options;
    
    // Get all relevant time entries
    const { entries } = await this.timeEntryRepo.getUserTimeEntries(
      userId,
      {
        projectId,
        taskId,
        startDate,
        endDate,
        page: 1,
        limit: 10000 // High limit to get all entries
      }
    );

    // Group the entries based on the groupBy parameter
    const groupedEntries = this.groupTimeEntries(entries, groupBy);
    
    // Calculate summaries for each group
    const summaries: TimeTrackingSummary[] = [];
    
    for (const [key, groupEntries] of Object.entries(groupedEntries)) {
      let totalDuration = 0;
      let billableDuration = 0;
      let nonBillableDuration = 0;
      let billableAmount = 0;
      
      for (const entry of groupEntries) {
        totalDuration += entry.duration;
        
        if (entry.billable) {
          billableDuration += entry.duration;
          
          if (entry.billableRate) {
            // Convert seconds to hours and multiply by rate
            billableAmount += (entry.duration / 3600) * entry.billableRate;
          }
        } else {
          nonBillableDuration += entry.duration;
        }
      }
      
      // Determine the period dates based on groupBy
      let periodStart: Date;
      let periodEnd: Date;
      
      if (groupBy === 'project' || groupBy === 'task') {
        periodStart = startDate;
        periodEnd = endDate;
      } else {
        // For time-based grouping, extract dates from the key
        const keyDate = new Date(key);
        periodStart = keyDate;
        
        if (groupBy === 'day') {
          periodEnd = new Date(keyDate.getTime() + 24 * 60 * 60 * 1000);
        } else if (groupBy === 'week') {
          periodEnd = new Date(keyDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (groupBy === 'month') {
          periodEnd = new Date(keyDate.getFullYear(), keyDate.getMonth() + 1, 1);
        }
      }
      
      // Create the summary object
      const summary: TimeTrackingSummary = {
        userId,
        projectId: groupBy === 'project' ? key : null,
        taskId: groupBy === 'task' ? key : null,
        periodStart,
        periodEnd,
        totalDuration,
        billableDuration,
        nonBillableDuration,
        billableAmount,
        currency: 'USD', // This should be configurable
        entries: groupEntries
      };
      
      summaries.push(summary);
    }
    
    return summaries;
  }

  // Get current running timer if any
  public async getCurrentTimer(userId: string): Promise<TimeEntry | null> {
    return this.timeEntryRepo.getCurrentTimer(userId);
  }

  // Get user time tracking settings
  public async getUserSettings(userId: string): Promise<TimeTrackingSettings> {
    const settings = await this.timeEntryRepo.getUserSettings(userId);
    
    // Return default settings if none are found
    if (!settings) {
      return {
        userId,
        defaultBillableRate: 0,
        roundingInterval: 15, // 15 minutes
        autoStopTimerAfterInactivity: 30, // 30 minutes
        reminderInterval: 0, // disabled
        workingHours: {
          '0': { start: '09:00', end: '17:00', isWorkDay: false }, // Sunday
          '1': { start: '09:00', end: '17:00', isWorkDay: true }, // Monday
          '2': { start: '09:00', end: '17:00', isWorkDay: true }, // Tuesday
          '3': { start: '09:00', end: '17:00', isWorkDay: true }, // Wednesday
          '4': { start: '09:00', end: '17:00', isWorkDay: true }, // Thursday
          '5': { start: '09:00', end: '17:00', isWorkDay: true }, // Friday
          '6': { start: '09:00', end: '17:00', isWorkDay: false } // Saturday
        }
      };
    }
    
    return settings;
  }

  // Update user time tracking settings
  public async updateUserSettings(
    userId: string,
    settings: Partial<TimeTrackingSettings>
  ): Promise<TimeTrackingSettings> {
    const currentSettings = await this.getUserSettings(userId);
    
    const updatedSettings: TimeTrackingSettings = {
      ...currentSettings,
      ...settings,
      userId // Ensure userId is not changed
    };
    
    return this.timeEntryRepo.updateUserSettings(userId, updatedSettings);
  }

  // Helper methods
  private groupTimeEntries(
    entries: TimeEntry[],
    groupBy: 'day' | 'week' | 'month' | 'project' | 'task'
  ): Record<string, TimeEntry[]> {
    const grouped: Record<string, TimeEntry[]> = {};
    
    for (const entry of entries) {
      let key: string;
      
      switch (groupBy) {
        case 'day':
          key = entry.startTime.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the start of the week (Sunday)
          const date = new Date(entry.startTime);
          const day = date.getDay();
          const diff = date.getDate() - day;
          const startOfWeek = new Date(date.setDate(diff));
          key = startOfWeek.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${entry.startTime.getFullYear()}-${String(entry.startTime.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'project':
          key = entry.projectId;
          break;
        case 'task':
          key = entry.taskId;
          break;
        default:
          key = 'all';
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      
      grouped[key].push(entry);
    }
    
    return grouped;
  }

  private applyTimeRounding(
    durationSeconds: number,
    roundingIntervalMinutes: number
  ): number {
    if (roundingIntervalMinutes <= 0) {
      return durationSeconds;
    }
    
    const intervalSeconds = roundingIntervalMinutes * 60;
    const remainder = durationSeconds % intervalSeconds;
    
    // Round up if more than half the interval
    if (remainder >= intervalSeconds / 2) {
      return durationSeconds + (intervalSeconds - remainder);
    } else {
      return durationSeconds - remainder;
    }
  }

  private async getBillableRate(
    userId: string,
    projectId: string
  ): Promise<BillableRate | null> {
    return this.timeEntryRepo.getBillableRate(userId, projectId);
  }
} 