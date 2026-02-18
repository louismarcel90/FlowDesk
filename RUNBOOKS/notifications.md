# Notifications Runbook

## Components
- Outbox Publisher (DB -> Kafka)
- Orchestrator (domain events -> notification jobs + in-app)
- Delivery Email (jobs -> SMTP)

## Common Issues
### 1) Emails not sending
- Check Mailpit UI: http://localhost:8025
- Check delivery worker logs
- Verify SMTP env in apps/workers/.env

### 2) Jobs stuck pending
- Inspect notification_jobs where status='pending' and next_attempt_at <= now()
- Verify delivery worker running

### 3) DLQ growing
- Use UI: /ops/notifications
- Or API: POST /admin/notifications/dlq/:id/reprocess
- Root cause: template render fail, SMTP down, invalid recipient
