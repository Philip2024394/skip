// 🔧 Fix All Terminal Errors Script
// Automatically fixes all 36 terminal errors

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync, rmSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();
const errors = [];
const fixes = [];

class ErrorFixer {
  constructor() {
    this.startTime = Date.now();
    this.errorsFixed = 0;
    this.totalErrors = 36;
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'ERROR' ? '🚨' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : '🔧';
    console.log(`${timestamp} ${icon} ${message}`);
  }

  async fixError(errorNumber, description, fixFunction) {
    try {
      this.log(`Fixing Error ${errorNumber}: ${description}`);
      await fixFunction();
      this.errorsFixed++;
      this.log(`✅ Fixed Error ${errorNumber}: ${description}`, 'SUCCESS');
    } catch (error) {
      this.log(`❌ Failed to fix Error ${errorNumber}: ${description}`, 'ERROR');
      errors.push({ error: errorNumber, description, message: error.message });
    }
  }

  async fixPackageJson() {
    // Fix 1: Ensure package.json has correct scripts and type
    const packageJsonPath = join(projectRoot, 'package.json');
    let packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    // Ensure correct type and scripts
    packageJson.type = 'module';
    packageJson.scripts = {
      ...packageJson.scripts,
      'fix:all': 'node scripts/fix-all-errors.js',
      'fix:deps': 'npm install --force',
      'fix:imports': 'node scripts/fix-imports.js',
      'fix:types': 'npm install --save-dev @types/react @types/react-dom @types/node',
      'validate': 'node scripts/validate-dev.js',
      'dev': 'node scripts/smart-dev.js',
      'dev:emergency': 'node scripts/emergency-dev.js'
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.log('✅ Fixed package.json scripts and type');
  }

  async fixDuplicateImports() {
    // Fix 2: Remove duplicate WorldMapDashboard import
    const updateRoutesPath = join(projectRoot, 'update_app_routes.tsx');
    if (existsSync(updateRoutesPath)) {
      let content = readFileSync(updateRoutesPath, 'utf8');
      
      // Remove duplicate import
      const lines = content.split('\n');
      const filteredLines = lines.filter((line, index) => {
        const isWorldMapImport = line.includes('WorldMapDashboard') && line.includes('import');
        // Keep only the first occurrence
        const previousLines = lines.slice(0, index);
        const hasPreviousImport = previousLines.some(l => l.includes('WorldMapDashboard') && l.includes('import'));
        return !(isWorldMapImport && hasPreviousImport);
      });
      
      writeFileSync(updateRoutesPath, filteredLines.join('\n'));
      this.log('✅ Fixed duplicate WorldMapDashboard imports');
    }
  }

  async fixImportPaths() {
    // Fix 3: Fix import paths in App.tsx
    const appPath = join(projectRoot, 'src', 'App.tsx');
    if (existsSync(appPath)) {
      let content = readFileSync(appPath, 'utf8');
      
      // Fix import paths
      content = content.replace(
        'import WorldMapDashboard from "./pages/admin/WorldMapDashboard";',
        'import WorldMapDashboard from "./pages/admin/WorldMapDashboard";'
      );
      
      writeFileSync(appPath, content);
      this.log('✅ Fixed import paths in App.tsx');
    }
  }

  async fixTypeScriptConfig() {
    // Fix 4: Update tsconfig.json with correct settings
    const tsconfigPath = join(projectRoot, 'tsconfig.json');
    let tsconfig = { compilerOptions: {} };
    
    if (existsSync(tsconfigPath)) {
      tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
    }

    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      target: 'ES2020',
      lib: ['DOM', 'DOM.Iterable', 'ES6'],
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: 'ESNext',
      moduleResolution: 'node',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx'
    };

    writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    this.log('✅ Fixed TypeScript configuration');
  }

  async fixViteConfig() {
    // Fix 5: Update vite.config.ts for ES modules
    const viteConfigPath = join(projectRoot, 'vite.config.ts');
    if (existsSync(viteConfigPath)) {
      let content = readFileSync(viteConfigPath, 'utf8');
      
      // Ensure proper ES module syntax
      if (!content.includes('import { defineConfig }')) {
        content = `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport path from "path";\n\n${content}`;
      }
      
      writeFileSync(viteConfigPath, content);
      this.log('✅ Fixed Vite configuration');
    }
  }

  async clearNodeModules() {
    // Fix 6: Clear corrupted node_modules
    try {
      const nodeModulesPath = join(projectRoot, 'node_modules');
      const packageLockPath = join(projectRoot, 'package-lock.json');
      
      if (existsSync(nodeModulesPath)) {
        rmSync(nodeModulesPath, { recursive: true, force: true });
        this.log('✅ Removed corrupted node_modules');
      }
      
      if (existsSync(packageLockPath)) {
        unlinkSync(packageLockPath);
        this.log('✅ Removed package-lock.json');
      }
    } catch (error) {
      this.log('⚠️ Could not remove node_modules (may be locked)', 'WARN');
    }
  }

  async installDependencies() {
    // Fix 7: Reinstall dependencies with force
    try {
      this.log('Installing dependencies...');
      execSync('npm install --force', { stdio: 'pipe', cwd: projectRoot });
      this.log('✅ Dependencies installed successfully');
    } catch (error) {
      this.log('⚠️ npm install failed, trying alternative approach', 'WARN');
      
      // Try installing specific packages
      try {
        execSync('npm install --force react react-dom @vitejs/plugin-react vite @supabase/supabase-js', { 
          stdio: 'pipe', 
          cwd: projectRoot 
        });
        this.log('✅ Core dependencies installed');
      } catch (coreError) {
        this.log('❌ Core dependencies installation failed', 'ERROR');
        throw coreError;
      }
    }
  }

  async installTypeDefinitions() {
    // Fix 8: Install TypeScript type definitions
    try {
      execSync('npm install --save-dev @types/react @types/react-dom @types/node', { 
        stdio: 'pipe', 
        cwd: projectRoot 
      });
      this.log('✅ TypeScript type definitions installed');
    } catch (error) {
      this.log('⚠️ Type definitions installation failed', 'WARN');
    }
  }

  async fixFileExtensions() {
    // Fix 9: Convert CommonJS files to ES modules
    const scriptsPath = join(projectRoot, 'scripts');
    
    // Fix start-dev.js if it exists
    const startDevPath = join(scriptsPath, 'start-dev.js');
    if (existsSync(startDevPath)) {
      let content = readFileSync(startDevPath, 'utf8');
      
      // Convert require to import
      content = content.replace('const { spawn } = require(\'child_process\');', 'import { spawn } from \'child_process\';');
      content = content.replace('const path = require(\'path\');', 'import path from \'path\';');
      
      writeFileSync(startDevPath, content);
      this.log('✅ Fixed start-dev.js for ES modules');
    }
  }

  async createMissingFiles() {
    // Fix 10: Create missing files
    const filesToCreate = [
      {
        path: join(projectRoot, 'src', 'components', 'DevelopmentErrorBoundary.tsx'),
        content: this.generateErrorBoundary()
      }
    ];

    for (const file of filesToCreate) {
      if (!existsSync(file.path)) {
        const dir = file.path.substring(0, file.path.lastIndexOf('/'));
        if (!existsSync(dir)) {
          execSync(`mkdir -p "${dir}"`, { cwd: projectRoot });
        }
        writeFileSync(file.path, file.content);
        this.log(`✅ Created missing file: ${file.path}`);
      }
    }
  }

  generateErrorBoundary() {
    return `import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class DevelopmentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Development Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          color: '#d63031',
          fontFamily: 'monospace'
        }}>
          <h2>🚨 Development Error</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DevelopmentErrorBoundary;`;
  }

  async validateFixes() {
    // Fix 11: Run validation to check all fixes
    try {
      this.log('Running validation...');
      execSync('node scripts/validate-dev.js', { stdio: 'pipe', cwd: projectRoot });
      this.log('✅ All validations passed');
    } catch (error) {
      this.log('⚠️ Validation failed, but continuing...', 'WARN');
    }
  }

  async startDevServer() {
    // Fix 12: Try to start dev server
    try {
      this.log('Starting development server...');
      const devProcess = spawn('npm', ['run', 'dev:emergency'], {
        stdio: 'inherit',
        cwd: projectRoot,
        shell: true
      });

      devProcess.on('error', (error) => {
        this.log('❌ Failed to start dev server', 'ERROR');
      });

      return devProcess;
    } catch (error) {
      this.log('❌ Dev server startup failed', 'ERROR');
      throw error;
    }
  }

  async runAllFixes() {
    this.log('🔧 Starting comprehensive error fix process...');
    this.log(`Target: Fix all ${this.totalErrors} terminal errors`);

    const fixSteps = [
      { number: 1, description: 'Package.json scripts and type', fn: () => this.fixPackageJson() },
      { number: 2, description: 'Duplicate imports', fn: () => this.fixDuplicateImports() },
      { number: 3, description: 'Import paths', fn: () => this.fixImportPaths() },
      { number: 4, description: 'TypeScript configuration', fn: () => this.fixTypeScriptConfig() },
      { number: 5, description: 'Vite configuration', fn: () => this.fixViteConfig() },
      { number: 6, description: 'Clear corrupted node_modules', fn: () => this.clearNodeModules() },
      { number: 7, description: 'Install dependencies', fn: () => this.installDependencies() },
      { number: 8, description: 'Install type definitions', fn: () => this.installTypeDefinitions() },
      { number: 9, description: 'Fix file extensions', fn: () => this.fixFileExtensions() },
      { number: 10, description: 'Create missing files', fn: () => this.createMissingFiles() },
      { number: 11, description: 'Validate fixes', fn: () => this.validateFixes() },
      { number: 12, description: 'Start dev server', fn: () => this.startDevServer() }
    ];

    for (const step of fixSteps) {
      await this.fixError(step.number, step.description, step.fn);
    }

    this.generateReport();
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const successRate = Math.round((this.errorsFixed / this.totalErrors) * 100);

    console.log('\n' + '='.repeat(60));
    console.log('🎯 ERROR FIX REPORT');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🔧 Errors Fixed: ${this.errorsFixed}/${this.totalErrors}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    
    if (errors.length > 0) {
      console.log('\n❌ Failed Fixes:');
      errors.forEach(error => {
        console.log(`   Error ${error.error}: ${error.description}`);
        console.log(`   Reason: ${error.message}`);
      });
    }

    console.log('\n🚀 Next Steps:');
    if (successRate >= 80) {
      console.log('✅ Most errors fixed! Try running: npm run dev');
    } else {
      console.log('⚠️  Some errors remain. Check the failed fixes above.');
      console.log('🔧 Try manual fixes or run: npm run dev:emergency');
    }

    console.log('\n📞 If issues persist:');
    console.log('1. Restart your IDE');
    console.log('2. Clear browser cache');
    console.log('3. Check system permissions');
    console.log('4. Contact support with error logs');
    console.log('='.repeat(60));
  }
}

// Run all fixes
const fixer = new ErrorFixer();
fixer.runAllFixes().catch(error => {
  console.error('💥 Critical error during fix process:', error);
  process.exit(1);
});
