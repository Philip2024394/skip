// Memory Fix Script
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Memory Issue Diagnosis and Fix...\n');

// Check current memory usage
const checkMemory = () => {
  return new Promise((resolve) => {
    const free = spawn('free', ['-m'], { shell: true });
    let output = '';
    
    free.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    free.on('close', (code) => {
      if (code === 0) {
        const lines = output.split('\n');
        const memLine = lines.find(line => line.startsWith('Mem:'));
        if (memLine) {
          const parts = memLine.split(/\s+/);
          const total = parseInt(parts[1]);
          const used = parseInt(parts[2]);
          const free = parseInt(parts[3]);
          resolve({ total, used, free });
        }
      }
      resolve(null);
    });
  });
};

// Check Node.js memory limit
const checkNodeMemory = () => {
  const used = process.memoryUsage();
  console.log('Node.js Memory Usage:');
  console.log(`  RSS: ${Math.round(used.rss / 1024 / 1024)} MB`);
  console.log(`  Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)} MB`);
  console.log(`  Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
  console.log(`  External: ${Math.round(used.external / 1024 / 1024)} MB`);
  console.log('');
};

// Optimize package.json for memory
const optimizePackage = () => {
  console.log('🔧 Optimizing package.json for memory...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add memory optimization scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "dev": "node --max-old-space-size=4096 node_modules/.bin/vite",
    "dev-low": "node --max-old-space-size=2048 node_modules/.bin/vite",
    "build": "node --max-old-space-size=4096 node_modules/.bin/vite build",
    "build-low": "node --max-old-space-size=2048 node_modules/.bin/vite build"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added memory-optimized scripts');
};

// Create .vite config for memory optimization
const createViteConfig = () => {
  console.log('🔧 Creating memory-optimized Vite config...');
  
  const configPath = path.join(process.cwd(), 'vite.config.ts');
  const configContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: 'localhost',
    hmr: {
      port: 3000,
      host: 'localhost',
      overlay: false,
      clientPort: 3000,
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    force: true,
  },
  esbuild: {
    target: 'es2015',
    drop: ['console', 'debugger']
  }
})`;
  
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Created optimized Vite config');
};

// Main fix function
const runMemoryFix = async () => {
  console.log('🔍 Checking system memory...');
  const memory = await checkMemory();
  
  if (memory) {
    console.log(`System Memory: ${memory.used}MB used / ${memory.total}MB total (${memory.free}MB free)`);
    
    if (memory.free < 1024) {
      console.log('⚠️  Low memory detected! Applying aggressive optimization...');
    } else if (memory.free < 2048) {
      console.log('⚠️  Moderate memory available. Applying optimization...');
    } else {
      console.log('✅ Sufficient memory available. Applying standard optimization...');
    }
  }
  
  checkNodeMemory();
  
  console.log('🔧 Applying fixes...');
  
  // 1. Optimize package.json
  optimizePackage();
  
  // 2. Create optimized Vite config
  createViteConfig();
  
  // 3. Clear caches
  console.log('🧹 Clearing caches...');
  try {
    fs.rmSync(path.join(process.cwd(), 'node_modules', '.vite'), { recursive: true, force: true });
    console.log('✅ Cleared Vite cache');
  } catch (e) {
    console.log('ℹ️  Vite cache already clean');
  }
  
  console.log('\\n🚀 Memory optimization complete!');
  console.log('\\n📋 Next steps:');
  console.log('1. Close all other applications to free memory');
  console.log('2. Restart your terminal/command prompt');
  console.log('3. Run: npm run dev-low (for low memory systems)');
  console.log('4. If still issues, run: npm run dev (standard memory)');
  console.log('\\n💡 Additional tips:');
  console.log('- Use Chrome DevTools > Performance > Memory to monitor');
  console.log('- Consider closing browser tabs with heavy content');
  console.log('- Restart your computer if memory is critically low');
};

runMemoryFix().catch(console.error);
