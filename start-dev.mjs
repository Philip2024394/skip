import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting development server with automatic fallback...');

// Try Vite first
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

let viteStarted = false;
let fallbackTimeout;

viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  if (output.includes('Local:') || output.includes('ready in')) {
    viteStarted = true;
    console.log('✅ Vite started successfully!');
    clearTimeout(fallbackTimeout);
  }
});

viteProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(output);
  
  if (output.includes('Invalid hook call') || output.includes('useState') || output.includes('Cannot read properties of null')) {
    console.log('❌ React hook error detected, preparing fallback...');
  }
});

viteProcess.on('close', (code) => {
  if (!viteStarted && code !== 0) {
    console.log('❌ Vite failed to start, switching to Parcel fallback...');
    startParcel();
  }
});

viteProcess.on('error', (error) => {
  console.log('❌ Vite error:', error.message);
  console.log('🔄 Switching to Parcel fallback...');
  startParcel();
});

// Fallback timeout - if Vite doesn't start in 10 seconds, switch to Parcel
fallbackTimeout = setTimeout(() => {
  if (!viteStarted) {
    console.log('⏰ Vite timeout, switching to Parcel fallback...');
    viteProcess.kill();
    startParcel();
  }
}, 10000);

function startParcel() {
  console.log('📦 Starting Parcel fallback bundler...');
  
  const parcelProcess = spawn('npm', ['run', 'dev:parcel'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  parcelProcess.on('close', (code) => {
    if (code !== 0) {
      console.log('❌ Parcel also failed. Please check your Node.js installation.');
    } else {
      console.log('✅ Parcel started successfully!');
    }
  });
  
  parcelProcess.on('error', (error) => {
    console.log('❌ Parcel error:', error.message);
    console.log('🔧 Please try: npm install --force && npm run dev:parcel');
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  viteProcess.kill();
  process.exit(0);
});
