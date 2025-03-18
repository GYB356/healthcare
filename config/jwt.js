export default {
  // Access token settings
  secret: process.env.JWT_SECRET,
  expiresIn: '1h',
  
  // Refresh token settings
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: '7d',
  
  // Token types
  tokenTypes: {
    ACCESS: 'access',
    REFRESH: 'refresh'
  },
  
  // Token options
  options: {
    accessToken: {
      algorithm: 'HS256',
      expiresIn: '1h'
    },
    refreshToken: {
      algorithm: 'HS256',
      expiresIn: '7d'
    }
  }
};