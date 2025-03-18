import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const auditLog = async (action, data) => {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO audit_logs (
        id, action, data, created_at
      ) VALUES ($1, $2, $3, NOW())`,
      [
        crypto.randomUUID(),
        action,
        JSON.stringify(data)
      ]
    );
  } catch (error) {
    console.error('Audit logging error:', error);
  } finally {
    client.release();
  }
};

// Audit middleware for tracking API requests
export const auditMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to capture response
  res.end = function (chunk, encoding, callback) {
    const duration = Date.now() - startTime;
    
    // Log the request
    auditLog('api:request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}; 