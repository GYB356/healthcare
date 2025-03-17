-- TimeTrackingSettings table
CREATE TABLE time_tracking_settings (
    user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_billable_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    rounding_interval INTEGER NOT NULL DEFAULT 15,
    auto_stop_timer_after_inactivity INTEGER NOT NULL DEFAULT 30,
    reminder_interval INTEGER NOT NULL DEFAULT 0,
    working_hours JSONB NOT NULL DEFAULT '{
        "0": {"start": "09:00", "end": "17:00", "isWorkDay": false},
        "1": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "2": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "3": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "4": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "5": {"start": "09:00", "end": "17:00", "isWorkDay": true},
        "6": {"start": "09:00", "end": "17:00", "isWorkDay": false}
    }',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- BillableRate table
CREATE TABLE billable_rates (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    task_type_id VARCHAR(36) REFERENCES task_types(id) ON DELETE CASCADE,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_at_least_one_id CHECK (
        (project_id IS NOT NULL) OR
        (user_id IS NOT NULL) OR
        (task_type_id IS NOT NULL)
    )
);

-- Create indexes for billable rates lookups
CREATE INDEX idx_billable_rates_project ON billable_rates(project_id);
CREATE INDEX idx_billable_rates_user ON billable_rates(user_id);
CREATE INDEX idx_billable_rates_task_type ON billable_rates(task_type_id);
CREATE INDEX idx_billable_rates_dates ON billable_rates(effective_from, effective_to);

-- TimeEntry table with version control
CREATE TABLE time_entries (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in seconds
    billable BOOLEAN NOT NULL DEFAULT TRUE,
    invoice_id VARCHAR(36) REFERENCES invoices(id) ON DELETE SET NULL,
    billable_rate DECIMAL(10, 2),
    tags TEXT[] DEFAULT '{}',
    source VARCHAR(10) NOT NULL CHECK (source IN ('timer', 'manual')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_duration_or_end_time CHECK (
        (end_time IS NULL AND duration IS NULL) OR -- running timer
        (end_time IS NOT NULL AND duration IS NOT NULL) -- completed entry
    )
);

-- Create materialized view for time entries summary
CREATE MATERIALIZED VIEW time_entries_summary AS
SELECT 
    user_id,
    project_id,
    DATE_TRUNC('day', start_time) as date,
    COUNT(*) as total_entries,
    SUM(duration) as total_duration,
    SUM(CASE WHEN billable THEN duration ELSE 0 END) as billable_duration,
    SUM(CASE WHEN billable THEN duration * COALESCE(billable_rate, 0) ELSE 0 END) as billable_amount
FROM time_entries
WHERE end_time IS NOT NULL
GROUP BY user_id, project_id, DATE_TRUNC('day', start_time);

-- Create unique index for the materialized view
CREATE UNIQUE INDEX idx_time_entries_summary_unique 
ON time_entries_summary (user_id, project_id, date);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_time_entries_summary()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY time_entries_summary;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh the materialized view
CREATE TRIGGER refresh_time_entries_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON time_entries
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_time_entries_summary();

-- Add additional indexes for performance
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, DATE_TRUNC('day', start_time));
CREATE INDEX idx_time_entries_project_date ON time_entries(project_id, DATE_TRUNC('day', start_time));
CREATE INDEX idx_time_entries_billable ON time_entries(billable) WHERE billable = true;
CREATE INDEX idx_time_entries_duration ON time_entries(duration) WHERE duration IS NOT NULL;

-- Add partial index for active timers
CREATE INDEX idx_time_entries_active_timer ON time_entries(user_id, start_time) 
WHERE end_time IS NULL;

-- Add function to calculate billable amount
CREATE OR REPLACE FUNCTION calculate_billable_amount(
    p_duration INTEGER,
    p_billable_rate DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE 
        WHEN p_duration IS NULL OR p_billable_rate IS NULL THEN 0
        ELSE (p_duration::DECIMAL / 3600) * p_billable_rate
    END;
END;
$$ LANGUAGE plpgsql;

-- Add function to get time entries with billable amounts
CREATE OR REPLACE FUNCTION get_time_entries_with_amounts(
    p_user_id VARCHAR,
    p_start_date TIMESTAMP,
    p_end_date TIMESTAMP
)
RETURNS TABLE (
    id VARCHAR,
    task_id VARCHAR,
    project_id VARCHAR,
    description TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER,
    billable BOOLEAN,
    billable_rate DECIMAL,
    billable_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.id,
        te.task_id,
        te.project_id,
        te.description,
        te.start_time,
        te.end_time,
        te.duration,
        te.billable,
        te.billable_rate,
        calculate_billable_amount(te.duration, te.billable_rate) as billable_amount
    FROM time_entries te
    WHERE te.user_id = p_user_id
    AND te.start_time >= p_start_date
    AND te.start_time <= p_end_date
    ORDER BY te.start_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_time_tracking_settings_timestamp
BEFORE UPDATE ON time_tracking_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_billable_rates_timestamp
BEFORE UPDATE ON billable_rates
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_time_entries_timestamp
BEFORE UPDATE ON time_entries
FOR EACH ROW EXECUTE FUNCTION update_timestamp(); 