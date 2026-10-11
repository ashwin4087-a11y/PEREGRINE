/**
 * PEREGRINE Backend Configuration
 * Combines simulation baseline config with runtime environment configuration.
 */

import dotenv from 'dotenv';
export * from '../engine/config';

// Load environment variables from .env file if available
dotenv.config();

export interface ServerConfig {
  port: number;
  frontendUrl: string;
  nodeEnv: string;
  apiPrefix: string;
}

export const SERVER_CONFIG: ServerConfig = {
  port: Number(process.env.PORT) || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: '/api'
};
