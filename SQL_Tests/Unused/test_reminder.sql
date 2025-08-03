-- Test reminder that's due today
-- This will trigger a popup notification when the page loads

-- First, make sure we have a maintenance event
INSERT IGNORE INTO UpcomingServices (event_id, user_id, vin, rec_date, rec_mileage, status) 
VALUES (999, 1, '1HGBH41JXMN109186', CURDATE(), 50000, 'pending');

-- Add a reminder that's due today
INSERT IGNORE INTO Reminder (reminder_id, event_id, message, send_date, is_sent) 
VALUES (999, 999, 'Test reminder - Oil change due today!', CURDATE(), 0);

-- Add another reminder for tomorrow
INSERT IGNORE INTO Reminder (reminder_id, event_id, message, send_date, is_sent) 
VALUES (998, 999, 'Test reminder - Brake inspection tomorrow', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 0); 