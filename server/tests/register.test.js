require('dotenv').config({ path: '../.env' });
const express = require('express');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createSupabaseClient } = require('../supabase/client');
const registerHandler = require('../api/auth/register');

const app = express();
app.use(express.json());
app.use('/api/auth/register', registerHandler);

jest.setTimeout(30000);

describe('Register API Handler', () => {
  let supabase;

  beforeAll(async () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.JWT_SECRET) {
      throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY, and JWT_SECRET must be defined in .env');
    }
    supabase = createSupabaseClient();
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared users table');
  });

  afterEach(async () => {
    if (process.env.KEEP_DATA !== 'true') {
      await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('Cleared users table after test');
    }
  });

  it('returns 405 if method is not POST', async () => {
    const response = await request(app)
      .get('/api/auth/register')
      .set('Accept', 'application/json');

    console.log('Response (GET method):', response.status, response.body);
    expect(response.status).toBe(405);
    expect(response.body.message).toBe('Only POST requests are allowed');
  });

  it('returns 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test' })
      .set('Accept', 'application/json');

    console.log('Response (missing fields):', response.status, response.body);
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Please provide all required fields: name, email, password, confirmPassword');
  });

  it("returns 400 if passwords don't match", async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test',
        email: 'test@example.com',
        role: 'customer',
        password: 'a',
        confirmPassword: 'b',
      })
      .set('Accept', 'application/json');

    console.log('Response (password mismatch):', response.status, response.body);
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Passwords don't match");
  });

  it('returns 400 if role is invalid', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test',
        email: 'test@example.com',
        role: 'invalid',
        password: 'password123',
        confirmPassword: 'password123',
      })
      .set('Accept', 'application/json');

    console.log('Response (invalid role):', response.status, response.body);
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Role must be either "customer" or "admin"');
  });

  it('creates a new user and returns a token on valid input', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        password: 'password123',
        confirmPassword: 'password123',
      })
      .set('Accept', 'application/json');

    console.log('Response (valid input):', response.status, response.body);

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@example.com')
      .single();

    expect(error).toBeNull();
    expect(user).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.role).toBe('customer');
    expect(user.password).not.toBe('password123');
  });

  it('returns 400 if user already exists', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await supabase.from('users').insert([{
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer',
      password: hashedPassword,
    }]);

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        password: 'password123',
        confirmPassword: 'password123',
      })
      .set('Accept', 'application/json');

    console.log('Response (duplicate user):', response.status, response.body);
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('User with that email already exists');
  });

  it('creates a user and preserves data for Supabase inspection', async () => {
    process.env.KEEP_DATA = 'true';
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Inspect User',
        email: `inspect${Date.now()}@example.com`,
        role: 'customer',
        password: 'inspect123',
        confirmPassword: 'inspect123',
      })
      .set('Accept', 'application/json');

    console.log('Response (inspection):', response.status, response.body);
    const allUsers = await supabase.from('users').select('*');
    console.log('Users in database:', allUsers.data);

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', response.request._data.email)
      .single();

    expect(error).toBeNull();
    expect(user).toBeDefined();
    expect(user.name).toBe('Inspect User');
    expect(user.role).toBe('customer');
    expect(user.password).not.toBe('inspect123');
  });
});