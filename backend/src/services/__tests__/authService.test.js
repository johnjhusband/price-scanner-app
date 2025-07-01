const AuthService = require('../authService');

describe('AuthService', () => {
  beforeEach(() => {
    // Clear any stored data before each test
    jest.clearAllMocks();
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hash = await AuthService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    test('should verify password correctly', async () => {
      const password = 'testPassword123';
      const hash = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await AuthService.verifyPassword('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token', () => {
    test('should generate token', () => {
      const userId = 'test_user_123';
      const token = AuthService.generateToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should verify valid token', () => {
      const userId = 'test_user_123';
      const token = AuthService.generateToken(userId);
      const decoded = AuthService.verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
      expect(decoded.timestamp).toBeDefined();
    });

    test('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = AuthService.verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('User Registration', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        fullName: 'Test User'
      };

      const result = await AuthService.register(
        userData.email,
        userData.username,
        userData.password,
        userData.fullName
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(userData.email.toLowerCase());
      expect(result.user.username).toBe(userData.username.toLowerCase());
      expect(result.user.fullName).toBe(userData.fullName);
      expect(result.user.passwordHash).toBeUndefined();
    });

    test('should throw error for missing required fields', async () => {
      await expect(AuthService.register('', 'username', 'password'))
        .rejects.toThrow('Email, username, and password are required');
      
      await expect(AuthService.register('email@test.com', '', 'password'))
        .rejects.toThrow('Email, username, and password are required');
      
      await expect(AuthService.register('email@test.com', 'username', ''))
        .rejects.toThrow('Email, username, and password are required');
    });

    test('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        username: 'uniqueuser1',
        password: 'password123'
      };

      // First registration should succeed
      await AuthService.register(userData.email, userData.username, userData.password);

      // Second registration with same email should fail
      await expect(
        AuthService.register(userData.email, 'differentuser', 'password123')
      ).rejects.toThrow('User with this email or username already exists');
    });

    test('should throw error for duplicate username', async () => {
      const userData = {
        email: 'unique@example.com',
        username: 'duplicateuser',
        password: 'password123'
      };

      // First registration should succeed
      await AuthService.register(userData.email, userData.username, userData.password);

      // Second registration with same username should fail
      await expect(
        AuthService.register('different@example.com', userData.username, 'password123')
      ).rejects.toThrow('User with this email or username already exists');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Register a test user before each login test
      await AuthService.register(
        'login@example.com',
        'loginuser',
        'correctpassword',
        'Login User'
      );
    });

    test('should login with email successfully', async () => {
      const result = await AuthService.login('login@example.com', 'correctpassword');

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('login@example.com');
      expect(result.user.passwordHash).toBeUndefined();
    });

    test('should login with username successfully', async () => {
      const result = await AuthService.login('loginuser', 'correctpassword');

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('loginuser');
    });

    test('should throw error for missing credentials', async () => {
      await expect(AuthService.login('', 'password'))
        .rejects.toThrow('Email/username and password are required');
      
      await expect(AuthService.login('email@test.com', ''))
        .rejects.toThrow('Email/username and password are required');
    });

    test('should throw error for invalid credentials', async () => {
      await expect(AuthService.login('login@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
      
      await expect(AuthService.login('nonexistent@example.com', 'password'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('Session Management', () => {
    let testToken;
    
    beforeEach(async () => {
      const result = await AuthService.register(
        'session@example.com',
        'sessionuser',
        'password123'
      );
      testToken = result.token;
    });

    test('should get user from valid token', () => {
      const user = AuthService.getUserFromToken(testToken);

      expect(user).toBeDefined();
      expect(user.email).toBe('session@example.com');
      expect(user.passwordHash).toBeUndefined();
    });

    test('should return null for invalid token', () => {
      const user = AuthService.getUserFromToken('invalid_token');
      expect(user).toBeNull();
    });

    test('should logout successfully', () => {
      // First verify token is valid
      const userBefore = AuthService.getUserFromToken(testToken);
      expect(userBefore).toBeDefined();

      // Logout
      const result = AuthService.logout(testToken);
      expect(result.message).toBe('Logged out successfully');

      // Token should now be invalid
      const userAfter = AuthService.getUserFromToken(testToken);
      expect(userAfter).toBeNull();
    });
  });

  describe('Middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    test('authenticate should call next with valid token', async () => {
      const result = await AuthService.register('middleware@example.com', 'middlewareuser', 'password123');
      req.headers.authorization = `Bearer ${result.token}`;

      AuthService.authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('middleware@example.com');
    });

    test('authenticate should return 401 without token', () => {
      AuthService.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('authenticate should return 401 with invalid token', () => {
      req.headers.authorization = 'Bearer invalid_token';

      AuthService.authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('optionalAuth should proceed without token', () => {
      AuthService.optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    test('optionalAuth should set user with valid token', async () => {
      const result = await AuthService.register('optional@example.com', 'optionaluser', 'password123');
      req.headers.authorization = `Bearer ${result.token}`;

      AuthService.optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('optional@example.com');
    });
  });
});