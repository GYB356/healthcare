import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { authenticate, generateToken, generateRefreshToken } from '../middleware/auth';
import { validateLogin, validateRegistration } from '../middleware/validation';
import { auditLog } from '../middleware/audit';
import config from '../config/jwt';
import rateLimit from 'express-rate-limit';
import speakeasy from 'speakeasy';

const router = express.Router();

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, firstName, lastName, role = 'PATIENT' } = req.body;

    // Check if user exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await client.query(
      'INSERT INTO users (id, email, password, firstName, lastName, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, firstName, lastName, role',
      [uuidv4(), email, hashedPassword, firstName, lastName, role]
    );

    // Generate tokens
    const user = result.rows[0];
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await User.findByIdAndUpdate(user.id, {
      $push: { refreshTokens: { token: refreshToken } }
    });

    // Log registration
    auditLog('user:register', { userId: user.id, role: user.role });

    // Remove password from response
    const userObject = user;
    delete userObject.password;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userObject,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  } finally {
    client.release();
  }
});

// Add rate limiting middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Add 2FA verification middleware
const verify2FA = async (req, res, next) => {
  try {
    const { email, twoFactorCode } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !user.twoFactorSecret) {
      return next();
    }
    
    const isValid = await speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode
    });
    
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid 2FA code',
        requires2FA: true 
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Login with enhanced security
router.post('/login', loginLimiter, validateLogin, verify2FA, async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, twoFactorCode } = req.body;

    // Get user
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await User.findByIdAndUpdate(user.id, {
      loginAttempts: 0,
      lastLogin: new Date()
    });

    // Generate token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token with device info
    await User.findByIdAndUpdate(user.id, {
      $push: { 
        refreshTokens: { 
          token: refreshToken,
          device: req.headers['user-agent'],
          ip: req.ip,
          lastUsed: new Date()
        } 
      }
    });

    // Log login with security details
    auditLog('user:login', { 
      userId: user.id, 
      role: user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      twoFactorEnabled: !!user.twoFactorSecret
    });

    // Remove sensitive data from response
    const userObject = user;
    delete userObject.password;
    delete userObject.twoFactorSecret;
    delete userObject.refreshTokens;

    res.json({
      success: true,
      message: 'Login successful',
      user: userObject,
      token,
      refreshToken,
      requires2FA: !!user.twoFactorSecret
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  } finally {
    client.release();
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.refreshSecret);

    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.id,
      'refreshTokens.token': refreshToken
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user._id);

    // Replace old refresh token with new one
    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: { token: refreshToken } }
    });
    
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { token: newRefreshToken } }
    });

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Log logout
    auditLog('user:logout', { userId: req.user._id, role: req.user.role });

    if (refreshToken) {
      // Remove specific refresh token
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: { token: refreshToken } }
      });
    } else {
      // Remove all refresh tokens (logout from all devices)
      await User.findByIdAndUpdate(req.user._id, {
        refreshTokens: []
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    // User is already attached to req by the authenticate middleware
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;