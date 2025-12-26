/**
 * Azure Functions Triggers Example
 *
 * This module registers all trigger functions:
 * - Timer Trigger: Scheduled execution
 * - Queue Trigger: Service Bus message processing
 * - Blob Trigger: File upload processing
 *
 * Each trigger demonstrates a different event-driven pattern.
 */

// Import all trigger functions to register them
import './timerTrigger.js';
import './queueTrigger.js';
import './blobTrigger.js';

console.log('Azure Functions triggers registered');
