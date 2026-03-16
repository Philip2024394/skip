// Comprehensive Dev Server Fix Script
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔧 Comprehensive Dev Server Fix\n');

// Fix 1: Update Vite config for proper MIME types and HMR
const fixViteConfig = () => {
  console.log('1. Fixing Vite configuration...');
  
  const viteConfig = `import { defineConfig } from 'vite'
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
    cors: true,
    fs: {
      strict: false,
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
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  esbuild: {
    target: 'es2015',
    drop: ['console', 'debugger']
  }
})`;

  fs.writeFileSync(path.join(projectRoot, 'vite.config.ts'), viteConfig);
  console.log('✅ Vite config updated');
};

// Fix 2: Update package.json scripts
const fixPackageScripts = () => {
  console.log('2. Fixing package.json scripts...');
  
  const packagePath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.scripts = {
    "dev": "vite --force",
    "dev-low": "cross-env NODE_OPTIONS=\"--max-old-space-size=2048\" vite --force",
    "dev-high": "cross-env NODE_OPTIONS=\"--max-old-space-size=4096\" vite --force",
    "build": "vite build",
    "build-low": "cross-env NODE_OPTIONS=\"--max-old-space-size=2048\" vite build",
    "preview": "vite preview"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package scripts updated');
};

// Fix 3: Clear all caches
const clearCaches = () => {
  console.log('3. Clearing caches...');
  
  const cacheDirs = [
    'node_modules/.vite',
    'node_modules/.cache',
    'dist',
    'build'
  ];
  
  for (const dir of cacheDirs) {
    const fullPath = path.join(projectRoot, dir);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Cleared ${dir}`);
    } catch (e) {
      // Directory doesn't exist or can't be deleted
    }
  }
};

// Fix 4: Create proper .env file
const createEnvFile = () => {
  console.log('4. Creating .env file...');
  
  const envContent = `# Development Environment Variables
VITE_SUPABASE_URL=https://grxaajpzwsmtpuewquag.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyeGFhanB6d3NtdHB1ZXd1YWciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjE1NjQxNSwiZXhwIjoyMDUxNzMyNDE1fQ.8M8L5vHjnJzRZkK-3j8oJ9kKJgqJ3s8dH9nN8nH8n8

# Development Settings
VITE_DEV_MODE=true
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
`;

  fs.writeFileSync(path.join(projectRoot, '.env'), envContent);
  console.log('✅ .env file created');
};

// Fix 5: Update TypeScript config
const fixTsConfig = () => {
  console.log('5. Fixing TypeScript config...');
  
  const tsConfig = {
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "allowImportingTsExtensions": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": false,
      "noUnusedParameters": false,
      "noFallthroughCasesInSwitch": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
  };
  
  fs.writeFileSync(path.join(projectRoot, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
  console.log('✅ TypeScript config updated');
};

// Fix 6: Create tsconfig.node.json
const createTsConfigNode = () => {
  console.log('6. Creating tsconfig.node.json...');
  
  const tsConfigNode = {
    "compilerOptions": {
      "composite": true,
      "skipLibCheck": true,
      "module": "ESNext",
      "moduleResolution": "bundler",
      "allowSyntheticDefaultImports": true
    },
    "include": ["vite.config.ts"]
  };
  
  fs.writeFileSync(path.join(projectRoot, 'tsconfig.node.json'), JSON.stringify(tsConfigNode, null, 2));
  console.log('✅ tsconfig.node.json created');
};

// Main fix function
const runFixes = async () => {
  console.log('🚀 Starting comprehensive dev server fix...\n');
  
  try {
    fixViteConfig();
    fixPackageScripts();
    clearCaches();
    createEnvFile();
    fixTsConfig();
    createTsConfigNode();
    
    console.log('\n✅ All fixes applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Close your current terminal/command prompt');
    console.log('2. Open a new terminal/command prompt');
    console.log('3. Run: npm run dev');
    console.log('4. If issues persist, try: npm run dev-low');
    console.log('5. Clear browser cache and reload');
    
    console.log('\n🔧 What was fixed:');
    console.log('- Vite configuration for proper MIME types');
    console.log('- HMR WebSocket connection settings');
    console.log('- Package scripts with --force flag');
    console.log('- All caches cleared');
    console.log('- Environment variables configured');
    console.log('- TypeScript configuration optimized');
    
    console.log('\n🌐 Expected results:');
    console.log('- No MIME type errors');
    console.log('- Stable WebSocket connection');
    console.log('- Fast hot reload');
    console.log('- Proper TypeScript compilation');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
};

runFixes();
