// HMR Connection Diagnostic Script
import { spawn } from 'child_process';
import net from 'net';
import fs from 'fs';

console.log('🔍 Diagnosing HMR Connection Issues...\n');

// Check if port 3000 is in use
const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
};

// Check network connectivity
const checkNetwork = () => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(3000, 'localhost', () => {
      console.log('✅ localhost:3000 is accessible');
      server.close();
      resolve(true);
    });
    
    server.on('error', (err) => {
      console.log('❌ localhost:3000 connection failed:', err.message);
      resolve(false);
    });
  });
};

// Main diagnostic function
const runDiagnostics = async () => {
  console.log('1. Checking port availability...');
  const portAvailable = await checkPort(3000);
  console.log(portAvailable ? '✅ Port 3000 is available' : '❌ Port 3000 is in use');
  
  console.log('\n2. Checking network connectivity...');
  await checkNetwork();
  
  console.log('\n3. Checking for common issues...');
  
  // Check if node_modules exists
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules exists');
  } else {
    console.log('❌ node_modules missing - run npm install');
  }
  
  // Check if vite is installed
  try {
    const viteModule = await import('vite');
    console.log('✅ Vite is installed');
  } catch (e) {
    console.log('❌ Vite not installed - run npm install');
  }
  
  console.log('\n🔧 Recommended Solutions:');
  console.log('1. Clear browser cache and reload');
  console.log('2. Disable browser extensions that block WebSocket');
  console.log('3. Try incognito/private mode');
  console.log('4. Check if firewall/antivirus is blocking localhost');
  console.log('5. Restart development server with: npm run dev');
  console.log('6. If issues persist, try: npx vite --force');
  
  console.log('\n🚀 Starting dev server with enhanced logging...');
  
  // Start dev server with enhanced error handling
  const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      DEBUG: 'vite:*',
      VITE_HMR_LOGGING: 'true'
    }
  });
  
  devServer.on('error', (error) => {
    console.error('❌ Dev server error:', error.message);
  });
  
  devServer.on('close', (code) => {
    console.log(`\n📊 Dev server exited with code: ${code}`);
    if (code !== 0) {
      console.log('\n🔄 Trying alternative approach...');
      console.log('Run: npx vite --port 3001 --host localhost');
    }
  });
};

runDiagnostics().catch(console.error);
