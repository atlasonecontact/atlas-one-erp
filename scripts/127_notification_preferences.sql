-- Notification Preferences Table for Telegram personalization
-- Each user can configure what notifications they want and when

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kiosko_id UUID REFERENCES kioscos(id) ON DELETE CASCADE,
  
  -- Notification types toggles
  notify_sales BOOLEAN DEFAULT true,              -- Each sale notification
  notify_low_stock BOOLEAN DEFAULT true,          -- Low stock alerts
  notify_daily_summary BOOLEAN DEFAULT false,     -- Daily summary at specific time
  notify_weekly_report BOOLEAN DEFAULT false,     -- Weekly report (Sundays)
  notify_large_sales BOOLEAN DEFAULT false,       -- Only sales above threshold
  notify_payment_type BOOLEAN DEFAULT false,      -- Filter by payment type
  
  -- Thresholds
  min_sale_amount DECIMAL(12,2) DEFAULT 0,        -- Only sales above this amount
  stock_threshold INT DEFAULT 10,                  -- Custom low stock threshold
  
  -- Payment type filter (null = all)
  payment_types TEXT[] DEFAULT NULL,              -- e.g., ['efectivo', 'tarjeta']
  
  -- Schedule settings
  summary_time TIME DEFAULT '20:00',              -- When to send daily summary
  quiet_hours_start TIME DEFAULT NULL,            -- Don't disturb from
  quiet_hours_end TIME DEFAULT NULL,              -- Don't disturb until
  
  -- State
  is_muted BOOLEAN DEFAULT false,                 -- Temporary mute all
  muted_until TIMESTAMPTZ DEFAULT NULL,           -- Mute until specific time
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One preference per user-kiosko combination (null kiosko = global defaults)
  UNIQUE(profile_id, kiosko_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_notification_prefs_profile ON notification_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_kiosko ON notification_preferences(kiosko_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences FOR DELETE
  USING (auth.uid() = profile_id);

-- Function to check if notification should be sent based on preferences
CREATE OR REPLACE FUNCTION should_send_notification(
  p_profile_id UUID,
  p_kiosko_id UUID,
  p_notification_type TEXT,
  p_sale_amount DECIMAL DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  prefs notification_preferences%ROWTYPE;
  current_time_of_day TIME;
BEGIN
  -- Get preferences (kiosko-specific or global)
  SELECT * INTO prefs FROM notification_preferences 
  WHERE profile_id = p_profile_id 
    AND (kiosko_id = p_kiosko_id OR kiosko_id IS NULL)
  ORDER BY kiosko_id NULLS LAST
  LIMIT 1;
  
  -- If no preferences, allow all notifications (default behavior)
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- Check if muted
  IF prefs.is_muted THEN
    RETURN false;
  END IF;
  
  -- Check if muted until specific time
  IF prefs.muted_until IS NOT NULL AND prefs.muted_until > now() THEN
    RETURN false;
  END IF;
  
  -- Check quiet hours
  current_time_of_day := LOCALTIME;
  IF prefs.quiet_hours_start IS NOT NULL AND prefs.quiet_hours_end IS NOT NULL THEN
    IF prefs.quiet_hours_start < prefs.quiet_hours_end THEN
      -- Normal range (e.g., 22:00 to 08:00 doesn't wrap)
      IF current_time_of_day >= prefs.quiet_hours_start AND current_time_of_day <= prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    ELSE
      -- Wrapping range (e.g., 22:00 to 08:00)
      IF current_time_of_day >= prefs.quiet_hours_start OR current_time_of_day <= prefs.quiet_hours_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  -- Check notification type
  CASE p_notification_type
    WHEN 'sale' THEN
      IF NOT prefs.notify_sales THEN
        RETURN false;
      END IF;
      -- Check sale amount threshold
      IF prefs.notify_large_sales AND p_sale_amount IS NOT NULL THEN
        IF p_sale_amount < prefs.min_sale_amount THEN
          RETURN false;
        END IF;
      END IF;
      -- Check payment type filter
      IF prefs.notify_payment_type AND prefs.payment_types IS NOT NULL AND p_payment_method IS NOT NULL THEN
        IF NOT (p_payment_method = ANY(prefs.payment_types)) THEN
          RETURN false;
        END IF;
      END IF;
    WHEN 'low_stock' THEN
      IF NOT prefs.notify_low_stock THEN
        RETURN false;
      END IF;
    WHEN 'daily_summary' THEN
      IF NOT prefs.notify_daily_summary THEN
        RETURN false;
      END IF;
    WHEN 'weekly_report' THEN
      IF NOT prefs.notify_weekly_report THEN
        RETURN false;
      END IF;
    ELSE
      -- Unknown type, allow by default
      RETURN true;
  END CASE;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_timestamp();

-- Grant access
GRANT ALL ON notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION should_send_notification TO authenticated;
