import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

app.http('hello', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    context.log('Hello function processed a request.');

    // Get name from query string or request body
    const name = request.query.get('name') || (await request.text()) || 'World';

    return {
      status: 200,
      jsonBody: {
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
        method: request.method,
      },
    };
  },
});
