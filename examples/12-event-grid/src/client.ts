import { EventGridPublisherClient, AzureKeyCredential } from '@azure/eventgrid';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.EVENT_GRID_TOPIC_ENDPOINT!;
const key = process.env.EVENT_GRID_TOPIC_KEY!;

if (!endpoint || !key) {
  throw new Error('Missing EVENT_GRID_TOPIC_ENDPOINT or EVENT_GRID_TOPIC_KEY. Run ./setup.sh first.');
}

// Create Event Grid publisher client
export const publisherClient = new EventGridPublisherClient(endpoint, 'EventGrid', new AzureKeyCredential(key));

export const config = {
  endpoint,
};
