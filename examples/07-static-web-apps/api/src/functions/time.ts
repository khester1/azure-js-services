import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

app.http('time', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    context.log('Time function processed a request.');

    const now = new Date();

    return {
      status: 200,
      jsonBody: {
        utc: now.toISOString(),
        unix: Math.floor(now.getTime() / 1000),
        formatted: now.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  },
});
