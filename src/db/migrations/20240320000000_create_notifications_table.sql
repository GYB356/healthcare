-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notification_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- Create function to notify when new notification is created
CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'new_notification',
        json_build_object(
            'user_id', NEW.user_id,
            'notification_id', NEW.id,
            'message', NEW.message,
            'type', NEW.type
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new notification notifications
CREATE TRIGGER notify_new_notification_trigger
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_notification();

-- Create view for unread notifications count
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT 
    user_id,
    COUNT(*) as unread_count
FROM notifications
WHERE read = false
GROUP BY user_id;

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = true;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to clean up old notifications
SELECT cron.schedule(
    'cleanup-old-notifications',
    '0 0 * * *', -- Run daily at midnight
    $$
    SELECT cleanup_old_notifications();
    $$
); 