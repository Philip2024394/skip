// Smart Development Server with Fallback Bundler Enforcement
// Auto-switches to Parcel if Vite fails, with comprehensive logging

import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();

// Development logger
class DevLogger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
  }

  log(level, message, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      error: error ? error.message : null,
      stack: error ? error.stack : null
    };
    
    this.logs.push(logEntry);
    
    const timestamp = new Date().toLocaleTimeString();
    const icon = level === 'ERROR' ? '🚨' : level === 'WARN' ? '⚠️' : level === 'INFO' ? 'ℹ️' : '✅';
    console.log(`${timestamp} ${icon} ${message}`);
    
    if (error && level === 'ERROR') {
      console.error('Stack trace:', error.stack);
    }
  }

  saveLogs() {
    const logFile = join(projectRoot, 'dev-logs.json');
    const fs = require('fs');
    fs.writeFileSync(logFile, JSON.stringify({
      session: {
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - this.startTime
      },
      logs: this.logs
    }, null, 2));
    this.log('INFO', `Development logs saved to ${logFile}`);
  }
}

// Error Boundary Component Generator
function generateErrorBoundary() {
  return `
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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
    
    // Log to development logs
    if (typeof window !== 'undefined' && window.devLogger) {
      window.devLogger.log('ERROR', 'React Error Boundary caught error', error);
    }
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
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

export default DevelopmentErrorBoundary;
  `;
}

// Lazy Loading Wrapper for Heavy Modules
function generateLazyWrapper() {
  return `
import React, { Suspense, lazy } from 'react';

// Lazy load heavy modules to prevent dev startup issues
const LazyAdGenerationDashboard = lazy(() => 
  import('./components/admin/AdGenerationDashboard').catch(err => {
    console.warn('⚠️ Failed to load AdGenerationDashboard:', err);
    return { default: () => React.createElement('div', null, 'Ad Generation Dashboard unavailable') };
  })
);

const LazyLibraryAdGenerationDashboard = lazy(() => 
  import('./components/admin/LibraryAdGenerationDashboard').catch(err => {
    console.warn('⚠️ Failed to load LibraryAdGenerationDashboard:', err);
    return { default: () => React.createElement('div', null, 'Library Ad Generation Dashboard unavailable') };
  })
);

const LazyEnhancedAdGenerationDashboard = lazy(() => 
  import('./components/admin/EnhancedAdGenerationDashboard').catch(err => {
    console.warn('⚠️ Failed to load EnhancedAdGenerationDashboard:', err);
    return { default: () => React.createElement('div', null, 'Enhanced Ad Generation Dashboard unavailable') };
  })
);

const LazyAdPerformanceDashboard = lazy(() => 
  import('./components/admin/AdPerformanceDashboard').catch(err => {
    console.warn('⚠️ Failed to load AdPerformanceDashboard:', err);
    return { default: () => React.createElement('div', null, 'Ad Performance Dashboard unavailable') };
  })
);

// Wrapper components with error boundaries
export const SafeAdGenerationDashboard = () => (
  React.createElement(Suspense, { fallback: React.createElement('div', null, 'Loading...') },
    React.createElement(LazyAdGenerationDashboard)
  )
);

export const SafeLibraryAdGenerationDashboard = () => (
  React.createElement(Suspense, { fallback: React.createElement('div', null, 'Loading...') },
    React.createElement(LazyLibraryAdGenerationDashboard)
  )
);

export const SafeEnhancedAdGenerationDashboard = () => (
  React.createElement(Suspense, { fallback: React.createElement('div', null, 'Loading...') },
    React.createElement(LazyEnhancedAdGenerationDashboard)
  )
);

export const SafeAdPerformanceDashboard = () => (
  React.createElement(Suspense, { fallback: React.createElement('div', null, 'Loading...') },
    React.createElement(LazyAdPerformanceDashboard)
  )
);
  `;
}

class SmartDevServer {
  constructor() {
    this.logger = new DevLogger();
    this.viteProcess = null;
    this.parcelProcess = null;
    this.currentBundler = null;
    this.attempts = 0;
    this.maxAttempts = 3;
  }

  async runValidation() {
    try {
      this.logger.log('INFO', 'Running pre-start validation...');
      execSync('node scripts/validate-dev.js', { stdio: 'pipe', cwd: projectRoot });
      this.logger.log('INFO', 'Validation passed');
    } catch (error) {
      this.logger.log('ERROR', 'Validation failed', error);
      throw error;
    }
  }

  generateErrorFiles() {
    try {
      // Generate error boundary component
      const errorBoundaryPath = join(projectRoot, 'src', 'components', 'DevelopmentErrorBoundary.tsx');
      const fs = require('fs');
      const path = require('path');
      
      if (!existsSync(path.dirname(errorBoundaryPath))) {
        fs.mkdirSync(path.dirname(errorBoundaryPath), { recursive: true });
      }
      
      fs.writeFileSync(errorBoundaryPath, generateErrorBoundary());
      this.logger.log('INFO', 'Generated DevelopmentErrorBoundary component');

      // Generate lazy loading wrapper
      const lazyWrapperPath = join(projectRoot, 'src', 'components', 'LazyAdminDashboards.tsx');
      fs.writeFileSync(lazyWrapperPath, generateLazyWrapper());
      this.logger.log('INFO', 'Generated lazy loading wrapper');

    } catch (error) {
      this.logger.log('WARN', 'Failed to generate error files (may already exist)', error);
    }
  }

  async tryVite() {
    return new Promise((resolve, reject) => {
      this.logger.log('INFO', 'Attempting to start Vite development server...');
      
      this.viteProcess = spawn('npm', ['run', 'dev'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: projectRoot,
        shell: true
      });

      let viteStarted = false;
      let startupTimeout;

      const cleanup = () => {
        if (startupTimeout) clearTimeout(startupTimeout);
        if (this.viteProcess) {
          this.viteProcess.kill();
          this.viteProcess = null;
        }
      };

      // Success detection
      const onViteOutput = (data) => {
        const output = data.toString();
        console.log(output);
        
        if (output.includes('Local:') || output.includes('ready in') || output.includes('VITE')) {
          viteStarted = true;
          this.currentBundler = 'vite';
          this.logger.log('INFO', '✅ Vite started successfully!');
          clearTimeout(startupTimeout);
          resolve('vite');
        }
      };

      // Error detection
      const onViteError = (data) => {
        const output = data.toString();
        console.error(output);
        
        if (output.includes('ERR_PACKAGE_PATH_NOT_EXPORTED') || 
            output.includes('Cannot find module') ||
            output.includes('Module not found')) {
          this.logger.log('ERROR', 'Vite module resolution error detected');
        }
      };

      // Process events
      this.viteProcess.stdout.on('data', onViteOutput);
      this.viteProcess.stderr.on('data', onViteError);
      this.viteProcess.on('close', (code) => {
        if (!viteStarted && code !== 0) {
          this.logger.log('WARN', 'Vite failed to start, will try Parcel');
          cleanup();
          reject(new Error('Vite failed'));
        }
      });

      this.viteProcess.on('error', (error) => {
        this.logger.log('ERROR', 'Vite process error', error);
        cleanup();
        reject(error);
      });

      // Timeout fallback
      startupTimeout = setTimeout(() => {
        if (!viteStarted) {
          this.logger.log('WARN', 'Vite startup timeout, switching to Parcel');
          cleanup();
          reject(new Error('Vite timeout'));
        }
      }, 15000); // 15 second timeout

      // Store cleanup for external use
      this.viteCleanup = cleanup;
    });
  }

  async tryParcel() {
    return new Promise((resolve, reject) => {
      this.logger.log('INFO', 'Starting Parcel fallback bundler...');
      
      this.parcelProcess = spawn('npm', ['run', 'dev:parcel'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: projectRoot,
        shell: true
      });

      let parcelStarted = false;
      let startupTimeout;

      const cleanup = () => {
        if (startupTimeout) clearTimeout(startupTimeout);
        if (this.parcelProcess) {
          this.parcelProcess.kill();
          this.parcelProcess = null;
        }
      };

      const onParcelOutput = (data) => {
        const output = data.toString();
        console.log(output);
        
        if (output.includes('Server running at') || output.includes('Built in')) {
          parcelStarted = true;
          this.currentBundler = 'parcel';
          this.logger.log('INFO', '✅ Parcel started successfully!');
          clearTimeout(startupTimeout);
          resolve('parcel');
        }
      };

      this.parcelProcess.stdout.on('data', onParcelOutput);
      this.parcelProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.error(output);
      });

      this.parcelProcess.on('close', (code) => {
        if (!parcelStarted && code !== 0) {
          this.logger.log('ERROR', 'Parcel also failed');
          cleanup();
          reject(new Error('Parcel failed'));
        }
      });

      this.parcelProcess.on('error', (error) => {
        this.logger.log('ERROR', 'Parcel process error', error);
        cleanup();
        reject(error);
      });

      // Timeout fallback
      startupTimeout = setTimeout(() => {
        if (!parcelStarted) {
          this.logger.log('ERROR', 'Parcel startup timeout');
          cleanup();
          reject(new Error('Parcel timeout'));
        }
      }, 20000); // 20 second timeout

      this.parcelCleanup = cleanup;
    });
  }

  async start() {
    try {
      this.logger.log('INFO', '🚀 Starting Smart Development Server...');
      this.logger.log('INFO', `Project root: ${projectRoot}`);

      // Step 1: Run validation
      await this.runValidation();

      // Step 2: Generate error handling files
      this.generateErrorFiles();

      // Step 3: Try Vite first
      try {
        await this.tryVite();
        this.logger.log('INFO', '🎉 Development server started with Vite');
        return;
      } catch (viteError) {
        this.logger.log('WARN', 'Vite failed, trying Parcel fallback', viteError);
      }

      // Step 4: Fallback to Parcel
      try {
        await this.tryParcel();
        this.logger.log('INFO', '🎉 Development server started with Parcel fallback');
        return;
      } catch (parcelError) {
        this.logger.log('ERROR', 'Both bundlers failed', parcelError);
        throw new Error('All bundlers failed to start');
      }

    } catch (error) {
      this.logger.log('ERROR', 'Failed to start development server', error);
      
      // Provide troubleshooting suggestions
      console.log('\n🔧 Troubleshooting Suggestions:');
      console.log('1. Run: npm install (reinstall dependencies)');
      console.log('2. Check: node_modules directory exists and is not locked');
      console.log('3. Verify: package.json has correct scripts');
      console.log('4. Clear: npm cache clean --force');
      console.log('5. Try: Delete node_modules and reinstall');
      
      throw error;
    }
  }

  stop() {
    this.logger.log('INFO', 'Stopping development server...');
    
    if (this.viteCleanup) {
      this.viteCleanup();
    }
    if (this.parcelCleanup) {
      this.parcelCleanup();
    }
    
    this.logger.saveLogs();
  }
}

// Handle process termination
const server = new SmartDevServer();

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.stop();
  process.exit(0);
});

// Start the server
server.start().catch(error => {
  console.error('💥 Failed to start development server:', error);
  process.exit(1);
});

// Make logger available globally for React components
if (typeof window !== 'undefined') {
  window.devLogger = server.logger;
}
