import { Pool, QueryResult } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { 
  TimeEntry, 
  TimeTrackingSettings,
  BillableRate
} from '../models/types';

interface TimeEntriesFilter {
  projectId?: string;
  taskId?: string;
  startDate?: Date;
  endDate?: Date;
  billable?: boolean;
  page: number;
  limit: number;
}

export default class TimeEntryRepository {
  private pool: Pool;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor() {
    this.pool = new Pool({
      // Database connection details from environment variables
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  // Cache helper methods
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // Create a new time entry with transaction
  public async createTimeEntry(entry: TimeEntry): Promise<TimeEntry> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO time_entries(
          id, task_id, project_id, user_id, description, 
          start_time, end_time, duration, billable, 
          invoice_id, billable_rate, tags, source, version
        ) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        entry.id || uuidv4(),
        entry.taskId,
        entry.projectId,
        entry.userId,
        entry.description,
        entry.startTime,
        entry.endTime,
        entry.duration,
        entry.billable,
        entry.invoiceId,
        entry.billableRate,
        entry.tags,
        entry.source,
        entry.version
      ];

      const result = await client.query(query, values);
      
      // Update materialized view
      await client.query('SELECT refresh_time_entries_summary()');
      
      await client.query('COMMIT');
      
      const timeEntry = this.mapTimeEntryFromDb(result.rows[0]);
      this.clearCache();
      
      return timeEntry;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create time entry: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Get a time entry by ID
  public async getTimeEntryById(timeEntryId: string): Promise<TimeEntry | null> {
    const query = `
      SELECT * FROM time_entries
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [timeEntryId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapTimeEntryFromDb(result.rows[0]);
  }

  // Update a time entry
  public async updateTimeEntry(timeEntryId: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    // Build the SET part of the query dynamically based on the updates
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Map TypeScript camelCase to database snake_case
    const fieldMappings: { [key: string]: string } = {
      taskId: 'task_id',
      projectId: 'project_id',
      userId: 'user_id',
      description: 'description',
      startTime: 'start_time',
      endTime: 'end_time',
      duration: 'duration',
      billable: 'billable',
      invoiceId: 'invoice_id',
      billableRate: 'billable_rate',
      tags: 'tags',
      source: 'source'
    };

    // Add each field that needs to be updated
    for (const [key, value] of Object.entries(updates)) {
      if (key in fieldMappings && value !== undefined) {
        setClauses.push(`${fieldMappings[key]} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (setClauses.length === 0) {
      // Nothing to update
      return this.getTimeEntryById(timeEntryId) as Promise<TimeEntry>;
    }
    
    const query = `
      UPDATE time_entries
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    values.push(timeEntryId);
    
    const result = await this.pool.query(query, values);
    return this.mapTimeEntryFromDb(result.rows[0]);
  }

  // Delete a time entry
  public async deleteTimeEntry(timeEntryId: string): Promise<void> {
    const query = `
      DELETE FROM time_entries
      WHERE id = $1
    `;
    
    await this.pool.query(query, [timeEntryId]);
  }

  // Get time entries with caching and pagination
  public async getUserTimeEntries(
    userId: string,
    filters: TimeEntriesFilter
  ): Promise<{ entries: TimeEntry[], total: number, page: number, limit: number }> {
    const cacheKey = `user_entries_${userId}_${JSON.stringify(filters)}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    const client = await this.pool.connect();
    
    try {
      // Build WHERE clauses based on filters
      const whereClauses: string[] = [`user_id = $1`];
      const values: any[] = [userId];
      let paramIndex = 2;
      
      if (filters.projectId) {
        whereClauses.push(`project_id = $${paramIndex}`);
        values.push(filters.projectId);
        paramIndex++;
      }
      
      if (filters.taskId) {
        whereClauses.push(`task_id = $${paramIndex}`);
        values.push(filters.taskId);
        paramIndex++;
      }
      
      if (filters.startDate) {
        whereClauses.push(`start_time >= $${paramIndex}`);
        values.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters.endDate) {
        whereClauses.push(`(end_time <= $${paramIndex} OR end_time IS NULL)`);
        values.push(filters.endDate);
        paramIndex++;
      }
      
      if (filters.billable !== undefined) {
        whereClauses.push(`billable = $${paramIndex}`);
        values.push(filters.billable);
        paramIndex++;
      }
      
      // Calculate pagination
      const offset = (filters.page - 1) * filters.limit;
      
      // Get total count using materialized view if possible
      let countQuery = `
        SELECT COUNT(*) FROM time_entries
        WHERE ${whereClauses.join(' AND ')}
      `;
      
      if (!filters.startDate && !filters.endDate) {
        countQuery = `
          SELECT COALESCE(SUM(total_entries), 0)
          FROM time_entries_summary
          WHERE user_id = $1
          ${filters.projectId ? 'AND project_id = $2' : ''}
        `;
      }
      
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count || countResult.rows[0].sum || '0', 10);
      
      // Get entries with pagination
      const query = `
        SELECT * FROM time_entries
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY start_time DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      values.push(filters.limit, offset);
      
      const result = await client.query(query, values);
      const entries = result.rows.map(row => this.mapTimeEntryFromDb(row));
      
      const response = {
        entries,
        total,
        page: filters.page,
        limit: filters.limit
      };
      
      this.setCached(cacheKey, response);
      return response;
    } finally {
      client.release();
    }
  }

  // Get current running timer for a user
  public async getCurrentTimer(userId: string): Promise<TimeEntry | null> {
    const query = `
      SELECT * FROM time_entries
      WHERE user_id = $1 AND end_time IS NULL
      ORDER BY start_time DESC
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapTimeEntryFromDb(result.rows[0]);
  }

  // Get user time tracking settings
  public async getUserSettings(userId: string): Promise<TimeTrackingSettings | null> {
    const query = `
      SELECT * FROM time_tracking_settings
      WHERE user_id = $1
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapSettingsFromDb(result.rows[0]);
  }

  // Update user time tracking settings
  public async updateUserSettings(
    userId: string,
    settings: TimeTrackingSettings
  ): Promise<TimeTrackingSettings> {
    // Check if settings exist first
    const existingSettings = await this.getUserSettings(userId);
    
    if (!existingSettings) {
      // Create new settings
      const insertQuery = `
        INSERT INTO time_tracking_settings(
          user_id, default_billable_rate, rounding_interval,
          auto_stop_timer_after_inactivity, reminder_interval, working_hours
        )
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        userId,
        settings.defaultBillableRate,
        settings.roundingInterval,
        settings.autoStopTimerAfterInactivity,
        settings.reminderInterval,
        settings.workingHours
      ];
      
      const result = await this.pool.query(insertQuery, values);
      return this.mapSettingsFromDb(result.rows[0]);
    } else {
      // Update existing settings
      const updateQuery = `
        UPDATE time_tracking_settings
        SET 
          default_billable_rate = $2,
          rounding_interval = $3,
          auto_stop_timer_after_inactivity = $4,
          reminder_interval = $5,
          working_hours = $6
        WHERE user_id = $1
        RETURNING *
      `;
      
      const values = [
        userId,
        settings.defaultBillableRate,
        settings.roundingInterval,
        settings.autoStopTimerAfterInactivity,
        settings.reminderInterval,
        settings.workingHours
      ];
      
      const result = await this.pool.query(updateQuery, values);
      return this.mapSettingsFromDb(result.rows[0]);
    }
  }

  // Get appropriate billable rate for user/project combination
  public async getBillableRate(
    userId: string,
    projectId: string,
    taskTypeId?: string
  ): Promise<BillableRate | null> {
    // Get the most specific rate available in this order:
    // 1. User + Project + TaskType specific rate
    // 2. User + Project rate
    // 3. User + TaskType rate
    // 4. Project + TaskType rate
    // 5. User rate (default user rate)
    // 6. Project rate (default project rate)
    // 7. TaskType rate (default rate for task type)
    
    const now = new Date();
    
    const query = `
      SELECT * FROM billable_rates
      WHERE (
        (user_id = $1 AND project_id = $2 AND task_type_id = $3) OR
        (user_id = $1 AND project_id = $2 AND task_type_id IS NULL) OR
        (user_id = $1 AND project_id IS NULL AND task_type_id = $3) OR
        (user_id IS NULL AND project_id = $2 AND task_type_id = $3) OR
        (user_id = $1 AND project_id IS NULL AND task_type_id IS NULL) OR
        (user_id IS NULL AND project_id = $2 AND task_type_id IS NULL) OR
        (user_id IS NULL AND project_id IS NULL AND task_type_id = $3)
      )
      AND effective_from <= $4
      AND (effective_to IS NULL OR effective_to > $4)
      ORDER BY 
        CASE 
          WHEN user_id IS NOT NULL AND project_id IS NOT NULL AND task_type_id IS NOT NULL THEN 1
          WHEN user_id IS NOT NULL AND project_id IS NOT NULL THEN 2
          WHEN user_id IS NOT NULL AND task_type_id IS NOT NULL THEN 3
          WHEN project_id IS NOT NULL AND task_type_id IS NOT NULL THEN 4
          WHEN user_id IS NOT NULL THEN 5
          WHEN project_id IS NOT NULL THEN 6
          WHEN task_type_id IS NOT NULL THEN 7
          ELSE 8
        END
      LIMIT 1
    `;
    
    const values = [userId, projectId, taskTypeId, now];
    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapBillableRateFromDb(result.rows[0]);
  }

  // Get time entries summary using materialized view
  public async getTimeEntriesSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeTrackingSummary> {
    const cacheKey = `summary_${userId}_${startDate.toISOString()}_${endDate.toISOString()}`;
    const cached = this.getCached(cacheKey);
    
    if (cached) {
      return cached;
    }

    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          SUM(total_entries) as total_entries,
          SUM(total_duration) as total_duration,
          SUM(billable_duration) as billable_duration,
          SUM(billable_amount) as billable_amount
        FROM time_entries_summary
        WHERE user_id = $1
        AND date BETWEEN $2 AND $3
      `;
      
      const result = await client.query(query, [userId, startDate, endDate]);
      const summary = this.mapSummaryFromDb(result.rows[0]);
      
      this.setCached(cacheKey, summary);
      return summary;
    } finally {
      client.release();
    }
  }

  // Helper methods to map database rows to typed objects
  private mapTimeEntryFromDb(row: any): TimeEntry {
    return {
      id: row.id,
      taskId: row.task_id,
      projectId: row.project_id,
      userId: row.user_id,
      description: row.description,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : null,
      duration: row.duration,
      billable: row.billable,
      invoiceId: row.invoice_id,
      billableRate: row.billable_rate,
      tags: row.tags,
      source: row.source,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapSettingsFromDb(row: any): TimeTrackingSettings {
    return {
      userId: row.user_id,
      defaultBillableRate: parseFloat(row.default_billable_rate),
      roundingInterval: row.rounding_interval,
      autoStopTimerAfterInactivity: row.auto_stop_timer_after_inactivity,
      reminderInterval: row.reminder_interval,
      workingHours: row.working_hours
    };
  }

  private mapBillableRateFromDb(row: any): BillableRate {
    return {
      id: row.id,
      projectId: row.project_id,
      userId: row.user_id,
      taskTypeId: row.task_type_id,
      hourlyRate: parseFloat(row.hourly_rate),
      currency: row.currency,
      effectiveFrom: new Date(row.effective_from),
      effectiveTo: row.effective_to ? new Date(row.effective_to) : null,
    };
  }
} 