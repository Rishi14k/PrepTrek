import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.preptrack_access_token;

    // Fallback: Check Authorization header Bearer token
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
      });
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account not found or has been deactivated.',
        });
      }

      req.user = user;
      next();
    } catch (err) {
      // If access token expired, attempt refresh token auto-recovery
      if (err.name === 'TokenExpiredError' && req.cookies?.preptrack_refresh_token) {
        try {
          const refreshDecoded = jwt.verify(
            req.cookies.preptrack_refresh_token,
            env.REFRESH_SECRET
          );
          const user = await User.findById(refreshDecoded.id).select('-passwordHash');
          if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
          }

          // Issue new access token
          const newAccessToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            env.JWT_SECRET,
            { expiresIn: env.JWT_EXPIRES_IN }
          );

          const isProduction = env.NODE_ENV === 'production';
          res.cookie('preptrack_access_token', newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/',
          });

          req.user = user;
          return next();
        } catch (refreshErr) {
          return res.status(401).json({
            success: false,
            message: 'Session expired. Please log in again.',
          });
        }
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication service failure.',
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You lack required administrative permissions.',
      });
    }
    next();
  };
};
