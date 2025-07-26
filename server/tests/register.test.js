const registerHandler = require('../api/auth/register');
const { createMocks } = require('node-mocks-http');

describe('User Registration API', () => {
  it('returns 400 if required fields are missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { username: 'testuser' }, // Missing others
    });

    await registerHandler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().message).toBe('Missing required fields');
  });

  it('returns 400 if passwords do not match', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: '123456',
        confirmPassword: '654321',
      },
    });

    await registerHandler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().message).toBe('Passwords do not match');
  });
});
