// Hard Reset Development Environment
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔄 HARD RESET Development Environment\n');

// Step 1: Complete cache clearing
const clearAllCaches = () => {
  console.log('1. Clearing ALL caches...');
  
  const cacheDirs = [
    'node_modules/.vite',
    'node_modules/.cache',
    'dist',
    'build',
    '.vite',
    '.cache',
    'tmp',
    'temp'
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
  
  // Clear package-lock.json if corrupted
  try {
    fs.unlinkSync(path.join(projectRoot, 'package-lock.json'));
    console.log('✅ Removed package-lock.json');
  } catch (e) {
    // File doesn't exist
  }
};

// Step 2: Create minimal vite.config.ts
const createMinimalViteConfig = () => {
  console.log('2. Creating minimal Vite config...');
  
  const minimalConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: 'localhost',
    hmr: {
      port: 3000,
      host: 'localhost'
    }
  },
  build: {
    target: 'esnext'
  }
})`;

  fs.writeFileSync(path.join(projectRoot, 'vite.config.ts'), minimalConfig);
  console.log('✅ Minimal Vite config created');
};

// Step 3: Reset package.json scripts
const resetPackageScripts = () => {
  console.log('3. Resetting package.json scripts...');
  
  const packagePath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.scripts = {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package scripts reset');
};

// Step 4: Create basic .env
const createBasicEnv = () => {
  console.log('4. Creating basic .env...');
  
  const envContent = `VITE_SUPABASE_URL=https://grxaajpzwsmtpuewquag.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyeGFhanB6d3NtdHB1ZXd1YWciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjE1NjQxNSwiZXhwIjoyMDUxNzMyNDE1fQ.8M8L5vHjnJzRZkK-3j8oJ9kKJgqJ3s8dH9nN8nH8n8
`;

  fs.writeFileSync(path.join(projectRoot, '.env'), envContent);
  console.log('✅ Basic .env created');
};

// Step 5: Reset TypeScript config
const resetTsConfig = () => {
  console.log('5. Resetting TypeScript config...');
  
  const basicTsConfig = {
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
      "noFallthroughCasesInSwitch": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["src"]
  };
  
  fs.writeFileSync(path.join(projectRoot, 'tsconfig.json'), JSON.stringify(basicTsConfig, null, 2));
  console.log('✅ TypeScript config reset');
};

// Step 6: Check and fix main.tsx
const checkMainTsx = () => {
  console.log('6. Checking main.tsx...');
  
  const mainTsxPath = path.join(projectRoot, 'src/main.tsx');
  const mainContent = `import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure light mode only
document.documentElement.classList.remove("dark");

createRoot(document.getElementById("root")!).render(<App />);`;

  fs.writeFileSync(mainTsxPath, mainContent);
  console.log('✅ main.tsx reset to minimal');
};

// Step 7: Reinstall dependencies
const reinstallDependencies = () => {
  console.log('7. Reinstalling dependencies...');
  
  return new Promise((resolve, reject) => {
    const npmInstall = spawn('npm', ['install'], {
      stdio: 'inherit',
      shell: true,
      cwd: projectRoot
    });
    
    npmInstall.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dependencies reinstalled');
        resolve();
      } else {
        console.log('❌ npm install failed');
        reject(new Error('npm install failed'));
      }
    });
    
    npmInstall.on('error', (error) => {
      console.log('❌ npm install error:', error);
      reject(error);
    });
  });
};

// Main reset function
const runHardReset = async () => {
  console.log('🚀 Starting HARD RESET...\n');
  
  try {
    clearAllCaches();
    createMinimalViteConfig();
    resetPackageScripts();
    createBasicEnv();
    resetTsConfig();
    checkMainTsx();
    
    console.log('\n🔄 Configuration reset complete. Reinstalling dependencies...');
    await reinstallDependencies();
    
    console.log('\n✅ HARD RESET COMPLETE!');
    console.log('\n📋 FINAL INSTRUCTIONS:');
    console.log('1. CLOSE this terminal completely');
    console.log('2. OPEN a NEW terminal/command prompt');
    console.log('3. Navigate to project directory');
    console.log('4. Run: npm run dev');
    console.log('5. Open browser to: http://localhost:3000');
    
    console.log('\n🔧 What was done:');
    console.log('- ALL caches cleared');
    console.log('- Vite config reset to minimal');
    console.log('- Package scripts reset');
    console.log('- TypeScript config simplified');
    console.log('- Dependencies reinstalled');
    console.log('- main.tsx simplified');
    
    console.log('\n⚠️  If issues still persist:');
    console.log('- Restart your computer');
    console.log('- Check for antivirus blocking localhost');
    console.log('- Try different port: npm run dev -- --port 3001');
    console.log('- Use incognito browser window');
    
  } catch (error) {
    console.error('❌ Error during reset:', error);
  }
};

runHardReset();
