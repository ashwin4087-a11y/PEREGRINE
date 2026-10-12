/**
 * PEREGRINE Full-Stack Development Runner
 * Starts backend (:3001) and frontend (:3000) concurrently with clean prefixed logging and graceful termination.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('======================================================');
console.log('STARTING PEREGRINE FULL-STACK ARCHITECTURE');
console.log('  Backend:  http://localhost:3001 (API Server)');
console.log('  Frontend: http://localhost:3000 (Vite Application)');
console.log('======================================================\n');

// 1. Spawn Backend Process
const backendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'backend'),
  stdio: 'pipe',
  env: { ...process.env, PORT: '3001' }
});

backendProcess.stdout?.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`\x1b[36m[BACKEND]\x1b[0m ${line}`);
    }
  }
});

backendProcess.stderr?.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.error(`\x1b[31m[BACKEND ERR]\x1b[0m ${line}`);
    }
  }
});

// 2. Spawn Frontend Process
const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'frontend'),
  stdio: 'pipe',
  env: { ...process.env, VITE_API_URL: 'http://localhost:3001' }
});

frontendProcess.stdout?.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log(`\x1b[32m[FRONTEND]\x1b[0m ${line}`);
    }
  }
});

frontendProcess.stderr?.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.error(`\x1b[33m[FRONTEND ERR]\x1b[0m ${line}`);
    }
  }
});

// Clean termination handling
function cleanExit() {
  console.log('\nShutting down PEREGRINE processes...');
  try {
    if (isWindows) {
      if (backendProcess.pid) spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t']);
      if (frontendProcess.pid) spawn('taskkill', ['/pid', String(frontendProcess.pid), '/f', '/t']);
    } else {
      backendProcess.kill('SIGINT');
      frontendProcess.kill('SIGINT');
    }
  } catch {
    // Ignore cleanup error
  }
  process.exit(0);
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
process.on('exit', cleanExit);
