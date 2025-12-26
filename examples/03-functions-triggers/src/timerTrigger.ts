/**
 * Timer Trigger Function
 *
 * Runs on a schedule defined by a CRON expression.
 * Common use cases:
 * - Cleanup jobs
 * - Report generation
 * - Data synchronization
 * - Health checks
 */

import { app, InvocationContext, Timer } from '@azure/functions';

// Timer trigger runs every 5 minutes
// CRON format: {second} {minute} {hour} {day} {month} {day-of-week}
app.timer('timerTrigger', {
  // Every 5 minutes
  schedule: '0 */5 * * * *',
  // Run immediately when starting locally (for testing)
  runOnStartup: true,
  handler: async (timer: Timer, context: InvocationContext) => {
    const now = new Date().toISOString();

    context.log(`Timer trigger executed at: ${now}`);
    context.log(`Timer schedule status:`, timer);

    // Check if we missed any scheduled runs
    if (timer.isPastDue) {
      context.log('Timer is running late!');
    }

    // Simulate some work
    await performScheduledTask(context);

    context.log('Timer trigger completed');
  },
});

async function performScheduledTask(context: InvocationContext): Promise<void> {
  // Example: Cleanup old records, send reports, sync data, etc.

  context.log('Performing scheduled task...');

  // Simulate async work
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Log metrics (would go to Application Insights in production)
  context.log('Scheduled task metrics:', {
    recordsProcessed: 42,
    durationMs: 1000,
    status: 'success',
  });
}

/*
 * Common CRON expressions:
 *
 * Every minute:        0 * * * * *
 * Every 5 minutes:     0 */5 * * * *
 * Every hour:          0 0 * * * *
 * Every day at noon:   0 0 12 * * *
 * Every Monday 9am:    0 0 9 * * 1
 * First of month:      0 0 0 1 * *
 *
 * Format: {sec} {min} {hour} {day} {month} {day-of-week}
 */
