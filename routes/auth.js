const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { authenticate, generateToken, generateRefreshToken } = require('../middleware/auth');
const { validateLogin, validateRegistration } = require('../middleware/validation');
const { auditLog } = require('../middleware/audit');
const config = require('../config/jwt');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'PATIENT' } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role
    });

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { token: refreshToken } }
    });

    // Log registration
    auditLog('user:register', { userId: user._id, role: user.role });

    // Remove password from response
    const userObject = user.toObject();
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
    res.status(500).json({ success: false, message: 'Failed to register user' });
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
  try {
    const { email, password, twoFactorCode } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials',
        attemptsRemaining: req.rateLimit.remaining
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockoutTime = new Date(user.lockUntil);
      if (lockoutTime > new Date()) {
        return res.status(401).json({ 
          success: false, 
          message: 'Account is locked. Please try again later.',
          lockUntil: lockoutTime
        });
      }
      // Reset lock if lockout period has expired
      user.isLocked = false;
      user.loginAttempts = 0;
      await user.save();
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Increment failed attempts
      user.loginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials',
        attemptsRemaining: 5 - user.loginAttempts
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token with device info
    await User.findByIdAndUpdate(user._id, {
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
      userId: user._id, 
      role: user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      twoFactorEnabled: !!user.twoFactorSecret
    });

    // Remove sensitive data from response
    const userObject = user.toObject();
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
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

module.exports = router;