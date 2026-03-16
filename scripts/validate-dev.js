// Development Validation Script
// Runs integrity checks before starting dev server

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();

// Validation checks
const validations = [
  {
    name: 'Package.json Integrity',
    check: () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      if (!existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
      }
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      if (!packageJson.scripts || !packageJson.scripts.dev) {
        throw new Error('dev script missing in package.json');
      }
      return '✅ package.json valid';
    }
  },
  {
    name: 'Node Modules Check',
    check: () => {
      const nodeModulesPath = join(projectRoot, 'node_modules');
      if (!existsSync(nodeModulesPath)) {
        throw new Error('node_modules not found - run npm install');
      }
      return '✅ node_modules exists';
    }
  },
  {
    name: 'Core Dependencies',
    check: () => {
      const coreDeps = ['react', 'react-dom', 'vite', '@vitejs/plugin-react'];
      const issues = [];
      
      coreDeps.forEach(dep => {
        const depPath = join(projectRoot, 'node_modules', dep);
        if (!existsSync(depPath)) {
          issues.push(dep);
        }
      });
      
      if (issues.length > 0) {
        throw new Error(`Missing dependencies: ${issues.join(', ')}`);
      }
      return '✅ Core dependencies available';
    }
  },
  {
    name: 'Supabase Client',
    check: () => {
      const supabasePath = join(projectRoot, 'node_modules', '@supabase', 'supabase-js');
      if (!existsSync(supabasePath)) {
        throw new Error('@supabase/supabase-js not found');
      }
      return '✅ Supabase client available';
    }
  },
  {
    name: 'Configuration Files',
    check: () => {
      const configs = ['vite.config.ts', 'tsconfig.json', 'tailwind.config.ts'];
      const issues = [];
      
      configs.forEach(config => {
        const configPath = join(projectRoot, config);
        if (!existsSync(configPath)) {
          issues.push(config);
        }
      });
      
      if (issues.length > 0) {
        throw new Error(`Missing config files: ${issues.join(', ')}`);
      }
      return '✅ Configuration files valid';
    }
  },
  {
    name: 'Source Files',
    check: () => {
      const srcPath = join(projectRoot, 'src');
      const appPath = join(srcPath, 'App.tsx');
      const indexPath = join(projectRoot, 'index.html');
      
      if (!existsSync(srcPath)) {
        throw new Error('src directory not found');
      }
      if (!existsSync(appPath)) {
        throw new Error('src/App.tsx not found');
      }
      if (!existsSync(indexPath)) {
        throw new Error('index.html not found');
      }
      return '✅ Source files valid';
    }
  }
];

// Run validations
console.log('🔍 Running development validation checks...\n');

let validationPassed = true;
const results = [];

for (const validation of validations) {
  try {
    const result = validation.check();
    results.push({ name: validation.name, status: '✅ PASS', message: result });
    console.log(`✅ ${validation.name}: ${result}`);
  } catch (error) {
    validationPassed = false;
    results.push({ name: validation.name, status: '❌ FAIL', message: error.message });
    console.error(`❌ ${validation.name}: ${error.message}`);
  }
}

// Summary
console.log('\n📊 Validation Summary:');
console.log(`Total checks: ${results.length}`);
console.log(`Passed: ${results.filter(r => r.status === '✅ PASS').length}`);
console.log(`Failed: ${results.filter(r => r.status === '❌ FAIL').length}`);

if (!validationPassed) {
  console.log('\n🚨 Validation failed! Please fix the issues above before starting development.');
  process.exit(1);
}

console.log('\n✅ All validations passed! Ready to start development server.');

// Export results for use in other scripts
export { results, validationPassed };
