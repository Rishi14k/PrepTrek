import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { generateTokens, setAuthCookies, clearAuthCookies } from '../utils/token.js';

// In-memory or database token store for password reset tokens
const resetTokens = new Map();

export const register = async (req, res) => {
  try {
    const { name, email, password, username, targetExam, targetExamDate } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'This username is already taken. Please choose another.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // If first user, make admin, else student
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'student';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      username: username || undefined,
      displayName: name.split(' ')[0],
      targetExam: targetExam || 'General Entrance Exam',
      targetExamDate: targetExamDate ? new Date(targetExamDate) : null,
    });

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
    });
  }
};

export const logout = async (req, res) => {
  try {
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error during logout.',
    });
  }
};

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving profile.',
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return safe message so as not to enumerate emails
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset token has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    // Token valid for 1 hour
    resetTokens.set(resetToken, {
      userId: user._id.toString(),
      expiresAt: Date.now() + 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully. In development/testing, use the provided token.',
      resetToken, // Provided in development for automated testing and ease of use
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process password recovery request.',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const tokenRecord = resetTokens.get(token);

    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    const user = await User.findById(tokenRecord.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    resetTokens.delete(token);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You may now log in with your new password.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
    });
  }
};
