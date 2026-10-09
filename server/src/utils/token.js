import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateTokens = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.REFRESH_SECRET, {
    expiresIn: env.REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = env.NODE_ENV === 'production';

  // Access Token Cookie
  res.cookie('preptrack_access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour
    path: '/',
  });

  // Refresh Token Cookie
  if (refreshToken) {
    res.cookie('preptrack_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
};

export const clearAuthCookies = (res) => {
  const isProduction = env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
  res.clearCookie('preptrack_access_token', cookieOptions);
  res.clearCookie('preptrack_refresh_token', cookieOptions);
};
