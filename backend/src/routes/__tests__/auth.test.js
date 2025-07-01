const request = require('supertest');
const express = require('express');
const authRoutes = require('../auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  let testToken;
  let testUser;

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        fullName: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.fullName).toBe(userData.fullName);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser'
          // missing password
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.required).toContain('password');
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    test('should return 400 for short username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'ab',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.error).toBe('Username must be between 3 and 30 characters');
    });

    test('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: '12345'
        })
        .expect(400);

      expect(response.body.error).toBe('Password must be at least 6 characters long');
    });

    test('should return 409 for duplicate registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        username: 'duplicateuser',
        password: 'password123'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Register a test user
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logintest@example.com',
          username: 'logintest',
          password: 'testpassword123',
          fullName: 'Login Test User'
        });
      
      testUser = response.body.user;
    });

    test('should login with email successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'logintest@example.com',
          password: 'testpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('logintest@example.com');
      expect(response.body.token).toBeDefined();
      
      testToken = response.body.token; // Save for other tests
    });

    test('should login with username successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'logintest',
          password: 'testpassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('logintest');
      expect(response.body.token).toBeDefined();
    });

    test('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'test@example.com'
          // missing password
        })
        .expect(400);

      expect(response.body.error).toBe('Email/username and password are required');
    });

    test('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'logintest@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('Authenticated Routes', () => {
    beforeAll(async () => {
      // Get fresh token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'logintest@example.com',
          password: 'testpassword123'
        });
      
      testToken = response.body.token;
    });

    describe('GET /api/auth/me', () => {
      test('should get current user with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe('logintest@example.com');
        expect(response.body.user.passwordHash).toBeUndefined();
      });

      test('should return 401 without token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .expect(401);

        expect(response.body.error).toBe('Authentication required');
      });

      test('should return 401 with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid_token')
          .expect(401);

        expect(response.body.error).toBe('Invalid or expired token');
      });
    });

    describe('POST /api/auth/logout', () => {
      test('should logout successfully', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Logged out successfully');
      });

      test('should return 401 after logout', async () => {
        // Use the same token after logout
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(401);

        expect(response.body.error).toBe('Invalid or expired token');
      });
    });
  });

  describe('POST /api/auth/verify-token', () => {
    let validToken;

    beforeAll(async () => {
      // Get a fresh token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'logintest@example.com',
          password: 'testpassword123'
        });
      
      validToken = response.body.token;
    });

    test('should verify valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: validToken })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('logintest@example.com');
    });

    test('should return invalid for bad token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({ token: 'invalid_token' })
        .expect(401);

      expect(response.body.valid).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    test('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-token')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Token is required');
    });
  });

  describe('GET /api/auth/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/auth/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('Authentication Service');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});