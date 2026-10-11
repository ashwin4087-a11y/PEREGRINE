/**
 * PEREGRINE Backend HTTP Server
 */

import app from './app';
import { SERVER_CONFIG } from './config';

const server = app.listen(SERVER_CONFIG.port, () => {
  console.log(`[PEREGRINE Backend] Server running on port ${SERVER_CONFIG.port}`);
  console.log(`[PEREGRINE Backend] Health check: http://localhost:${SERVER_CONFIG.port}/api/health`);
  console.log(`[PEREGRINE Backend] Environment: ${SERVER_CONFIG.nodeEnv}`);
});

process.on('SIGTERM', () => {
  console.log('[PEREGRINE Backend] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[PEREGRINE Backend] HTTP server closed');
  });
});

export default server;
