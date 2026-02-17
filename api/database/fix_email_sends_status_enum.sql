-- Fix email_sends.status enum and recover rows stored as empty status ('')
-- Run this once in phpMyAdmin on production.

-- 1) Ensure enum includes all statuses used by the app.
ALTER TABLE email_sends
MODIFY COLUMN status ENUM(
  'pending',
  'scheduled',
  'sending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'failed',
  'paused',
  'cancelled'
) NOT NULL DEFAULT 'pending';

-- 2) Backfill invalid/empty statuses created before enum update.
UPDATE email_sends
SET status = CASE
  WHEN sent_at IS NOT NULL THEN 'sent'
  WHEN scheduled_for IS NOT NULL THEN 'scheduled'
  ELSE 'pending'
END
WHERE status = '' OR status IS NULL;

-- 3) Optional quick verification
-- SELECT status, COUNT(*) FROM email_sends GROUP BY status ORDER BY status;
-- SELECT COUNT(*) AS due_now FROM email_sends WHERE status = 'scheduled' AND scheduled_for <= NOW();
