export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: '24h', // Changé de 15m à 24h
  REFRESH_TOKEN_EXPIRY_DAYS: 30,
  RESET_PASSWORD_TOKEN_EXPIRY: '15m',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_DURATION_MINUTES: 15,
  BCRYPT_ROUNDS: 12,
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? ('strict' as const) : ('lax' as const),
    maxAge: 24 * 60 * 60 * 1000, // 24 heures pour access_token
  },
  REFRESH_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? ('strict' as const) : ('lax' as const),
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours pour refresh_token
  },
  ACCESS_TOKEN_COOKIE_NAME: 'access_token',
  REFRESH_TOKEN_COOKIE_NAME: 'refresh_token',
};
