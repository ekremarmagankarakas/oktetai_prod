require('dotenv').config();
const request = require('supertest');
const express = require('express');
const { authenticateUser } = require('../middleware/authMiddleware');

const mockIsAuthenticated = jest.fn();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.isAuthenticated = mockIsAuthenticated;
  next();
});

app.get('/login', (req, res) => {
  res.status(200).json({ message: 'Login page' });
});

app.get('/terms-conditions', (req, res) => {
  res.status(200).json({ message: 'Terms and Conditions' });
});

app.get('/protected', authenticateUser, (req, res) => {
  res.status(200).json({ message: 'Access granted' });
});

describe('Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should allow access to public routes', async () => {
      const response = await request(app).get('/login');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login page');
    });
  
    it('should call next for public routes', async () => {
      const response = await request(app).get('/terms-conditions');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Terms and Conditions');
    });
  
    it('should redirect to /login for non-public routes if not authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      const response = await request(app).get('/protected');
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/login');
    });
  
    it('should allow access to protected routes if authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(true);
      const response = await request(app).get('/protected');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Access granted');
    });
  });
});