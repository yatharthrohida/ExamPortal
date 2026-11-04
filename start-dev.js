import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('   Starting ExamPortal (Frontend + Backend Server)  ');
console.log('====================================================\n');

// 1. Start Express Backend Server
const serverProcess = spawn(process.execPath, ['src/server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '1' }
});

// 2. Start Vite React Frontend
const clientProcess = spawn('npm run dev', {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

function cleanup() {
  console.log('\nStopping servers...');
  try { serverProcess.kill(); } catch (e) {}
  try { clientProcess.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

serverProcess.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[SERVER] exited with code ${code}`);
  }
});

clientProcess.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`[CLIENT] exited with code ${code}`);
  }
});
