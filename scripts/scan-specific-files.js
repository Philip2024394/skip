// Specific Files Scanner - Check for old/unused files by type
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Scanning for specific types of unused files...\n');

// Common patterns for old/unused files
const suspiciousPatterns = [
  /^old/i,
  /^backup/i,
  /^temp/i,
  /^test/i,
  /^demo/i,
  /^sample/i,
  /^copy/i,
  /^draft/i,
  /\.old\./i,
  /\.backup\./i,
  /\.temp\./i,
  /\.test\./i,
  /\.demo\./i,
  /\.sample\./i,
  /\.copy\./i,
  /\.draft\./i,
  /-old\./i,
  /-backup\./i,
  /-temp\./i,
  /-test\./i,
  /-demo\./i,
  /-sample\./i,
  /-copy\./i,
  /-draft\./i,
  /_old\./i,
  /_backup\./i,
  /_temp\./i,
  /_test\./i,
  /_demo\./i,
  /_sample\./i,
  /_copy\./i,
  /_draft\./i,
  /\(\d+\)\./, // Files with (1), (2), etc.
  /~\$/, // Temporary files
  /\.log$/i,
  /\.tmp$/i
];

// Get files matching suspicious patterns
const getSuspiciousFiles = () => {
  const suspiciousFiles = [];
  
  const scanDir = (dir, relativeDir = '') => {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const relativePath = path.join(relativeDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip certain directories
          if (!['node_modules', '.git', '.vscode', 'dist', 'build', '.parcel-cache', '.vite', 'coverage', 'test-app', 'skip'].includes(file)) {
            scanDir(filePath, relativePath);
          }
        } else {
          // Check if file matches suspicious patterns
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(file)) {
              suspiciousFiles.push({
                path: relativePath,
                fullPath: filePath,
                size: stat.size,
                modified: stat.mtime,
                pattern: pattern.toString()
              });
              break;
            }
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  };
  
  scanDir(projectRoot);
  return suspiciousFiles;
};

// Check for large files that might be unused
const getLargeFiles = (sizeThreshold = 1024 * 1024) => { // 1MB
  const largeFiles = [];
  
  const scanDir = (dir, relativeDir = '') => {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const relativePath = path.join(relativeDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', '.vscode', 'dist', 'build', '.parcel-cache', '.vite', 'coverage', 'test-app', 'skip'].includes(file)) {
            scanDir(filePath, relativePath);
          }
        } else {
          if (stat.size > sizeThreshold) {
            largeFiles.push({
              path: relativePath,
              fullPath: filePath,
              size: stat.size,
              modified: stat.mtime
            });
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  };
  
  scanDir(projectRoot);
  return largeFiles.sort((a, b) => b.size - a.size);
};

// Check for duplicate files
const getDuplicateFiles = () => {
  const fileHashes = {};
  const duplicates = [];
  
  const scanDir = (dir, relativeDir = '') => {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const relativePath = path.join(relativeDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', '.vscode', 'dist', 'build', '.parcel-cache', '.vite', 'coverage', 'test-app', 'skip'].includes(file)) {
            scanDir(filePath, relativePath);
          }
        } else {
          // Simple hash based on size and extension
          const hash = `${stat.size}-${path.extname(file)}`;
          
          if (fileHashes[hash]) {
            fileHashes[hash].push(relativePath);
          } else {
            fileHashes[hash] = [relativePath];
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  };
  
  scanDir(projectRoot);
  
  // Find duplicates
  for (const [hash, files] of Object.entries(fileHashes)) {
    if (files.length > 1) {
      duplicates.push({
        hash,
        files,
        size: fs.statSync(path.join(projectRoot, files[0])).size
      });
    }
  }
  
  return duplicates;
};

// Format file size
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Format date
const formatDate = (date) => {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Main scan function
const scanSpecificFiles = () => {
  console.log('🔍 Checking for suspicious files...');
  const suspiciousFiles = getSuspiciousFiles();
  
  console.log('📏 Checking for large files...');
  const largeFiles = getLargeFiles();
  
  console.log('🔄 Checking for duplicate files...');
  const duplicateFiles = getDuplicateFiles();
  
  console.log('\n📊 Results:');
  
  // Suspicious files
  if (suspiciousFiles.length > 0) {
    console.log(`\n⚠️  Found ${suspiciousFiles.length} suspicious files:`);
    suspiciousFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.path} (${formatSize(file.size)}, modified: ${formatDate(file.modified)})`);
    });
  } else {
    console.log('\n✅ No suspicious files found');
  }
  
  // Large files
  if (largeFiles.length > 0) {
    console.log(`\n📏 Found ${largeFiles.length} large files (>1MB):`);
    largeFiles.slice(0, 10).forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.path} (${formatSize(file.size)}, modified: ${formatDate(file.modified)})`);
    });
    if (largeFiles.length > 10) {
      console.log(`  ... and ${largeFiles.length - 10} more`);
    }
  } else {
    console.log('\n✅ No large files found');
  }
  
  // Duplicate files
  if (duplicateFiles.length > 0) {
    console.log(`\n🔄 Found ${duplicateFiles.length} potential duplicate groups:`);
    duplicateFiles.forEach((group, index) => {
      console.log(`  ${index + 1}. Size: ${formatSize(group.size)}`);
      group.files.forEach(file => {
        console.log(`     - ${file}`);
      });
      console.log('');
    });
  } else {
    console.log('\n✅ No duplicate files found');
  }
  
  // Save results
  const results = {
    scanDate: new Date().toISOString(),
    suspiciousFiles: suspiciousFiles.map(f => ({
      path: f.path,
      size: f.size,
      modified: f.modified,
      pattern: f.pattern
    })),
    largeFiles: largeFiles.map(f => ({
      path: f.path,
      size: f.size,
      modified: f.modified
    })),
    duplicateFiles: duplicateFiles.map(g => ({
      hash: g.hash,
      size: g.size,
      files: g.files
    }))
  };
  
  fs.writeFileSync(
    path.join(projectRoot, 'specific-files-scan-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n💾 Detailed results saved to: specific-files-scan-results.json');
  
  if (suspiciousFiles.length === 0 && largeFiles.length === 0 && duplicateFiles.length === 0) {
    console.log('\n🎉 Your project looks clean! No obvious unused files found.');
  } else {
    console.log('\n⚠️  Review the files above before deletion. Some might be legitimate.');
  }
};

scanSpecificFiles().catch(console.error);
