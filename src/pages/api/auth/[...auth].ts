import { NextApiRequest, NextApiResponse } from 'next';
import httpProxyMiddleware from 'next-http-proxy-middleware';

const getTargetService = (path: string): string => {
  if (path.includes('/login')) return process.env.LOGIN_SERVICE_URL || 'http://localhost:3005';
  if (path.includes('/register')) return process.env.REGISTER_SERVICE_URL || 'http://localhost:3007';
  return process.env.LOGIN_SERVICE_URL || 'http://localhost:3005';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const target = getTargetService(req.url || '');
  console.log(`[Proxy] Auth request to: ${req.method} ${req.url}`);

  try {
    return httpProxyMiddleware(req, res, {
      target,
      changeOrigin: true,
      pathRewrite: { '^/api/auth': '/api/auth' },
      onError: (err, req, res) => {
        console.error('[Proxy] Auth service error:', err);
        res.status(500).json({
          message: 'Authentication service is unavailable. Please try again later.'
        });
      }
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while processing your request.'
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};