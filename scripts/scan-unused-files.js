// Unused Files Scanner
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Scanning for unused files...\n');

// File extensions to consider
const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.less'];
const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
const allExtensions = [...codeExtensions, ...imageExtensions];

// Directories to ignore
const ignoreDirs = [
  'node_modules',
  '.git',
  '.vscode',
  'dist',
  'build',
  '.parcel-cache',
  '.vite',
  'coverage',
  'test-app',
  'skip'
];

// Files to always keep
const keepFiles = [
  'package.json',
  'package-lock.json',
  'README.md',
  '.gitignore',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'index.html'
];

// Get all files in the project
const getAllFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (allExtensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  
  return fileList;
};

// Get all import statements from a file
const getImports = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Match various import patterns
    const patterns = [
      /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /@import\s+['"`]([^'"`]+)['"`]/g,
      /src\s*=\s*['"`]([^'"`]+)['"`]/g,
      /href\s*=\s*['"`]([^'"`]+)['"`]/g,
      /background(?:-image)?:\s*url\s*\(\s*['"`]?([^'"`)]+)['"`]?\s*\)/g,
      /<img[^>]+src\s*=\s*['"`]([^'"`]+)['"`][^>]*>/g,
      /<source[^>]+src\s*=\s*['"`]([^'"`]+)['"`][^>]*>/g,
      /<link[^>]+href\s*=\s*['"`]([^'"`]+)['"`][^>]*>/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }
    
    return imports;
  } catch (error) {
    return [];
  }
};

// Check if a file is referenced
const isFileReferenced = (filePath, allFiles, imports) => {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(projectRoot, filePath);
  const relativePathNoExt = relativePath.replace(/\.[^/.]+$/, '');
  
  // Check if file is in keep files
  if (keepFiles.includes(fileName)) {
    return true;
  }
  
  // Check direct imports
  for (const importPath of imports) {
    // Remove query parameters and hash
    const cleanImportPath = importPath.split('?')[0].split('#')[0];
    
    // Check exact match
    if (cleanImportPath === relativePath || 
        cleanImportPath === relativePathNoExt ||
        cleanImportPath.endsWith('/' + relativePath) ||
        cleanImportPath.endsWith('/' + relativePathNoExt)) {
      return true;
    }
    
    // Check with @ alias
    if (cleanImportPath.startsWith('@/')) {
      const aliasPath = cleanImportPath.replace('@', 'src');
      if (aliasPath === relativePath || 
          aliasPath === relativePathNoExt ||
          aliasPath.endsWith('/' + relativePath) ||
          aliasPath.endsWith('/' + relativePathNoExt)) {
        return true;
      }
    }
    
    // Check with relative paths
    if (cleanImportPath.startsWith('./') || cleanImportPath.startsWith('../')) {
      // This would need more complex resolution, but for now we'll be conservative
      return true;
    }
  }
  
  // Check if file name appears in any content (conservative approach)
  for (const otherFile of allFiles) {
    if (otherFile === filePath) continue;
    
    try {
      const content = fs.readFileSync(otherFile, 'utf8');
      if (content.includes(fileName) || content.includes(relativePathNoExt)) {
        return true;
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  return false;
};

// Main scan function
const scanUnusedFiles = () => {
  console.log('📁 Discovering files...');
  const allFiles = getAllFiles(projectRoot);
  console.log(`Found ${allFiles.length} files to analyze\n`);
  
  console.log('🔍 Analyzing imports and references...');
  const allImports = [];
  for (const file of allFiles) {
    if (codeExtensions.includes(path.extname(file))) {
      const imports = getImports(file);
      allImports.push(...imports);
    }
  }
  
  console.log(`Found ${allImports.length} import statements\n`);
  
  console.log('🔍 Checking for unused files...');
  const unusedFiles = [];
  const usedFiles = [];
  
  for (const file of allFiles) {
    if (isFileReferenced(file, allFiles, allImports)) {
      usedFiles.push(file);
    } else {
      unusedFiles.push(file);
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Used files: ${usedFiles.length}`);
  console.log(`❌ Unused files: ${unusedFiles.length}`);
  
  if (unusedFiles.length > 0) {
    console.log('\n🗑️  Potentially unused files:');
    unusedFiles.forEach((file, index) => {
      const relativePath = path.relative(projectRoot, file);
      const size = fs.statSync(file).size;
      const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
      console.log(`  ${index + 1}. ${relativePath} (${sizeStr})`);
    });
    
    console.log('\n⚠️  WARNING: Before deleting these files:');
    console.log('1. Review the list carefully');
    console.log('2. Some files might be dynamically imported');
    console.log('3. Some files might be used in build processes');
    console.log('4. Backup your project before deletion');
    
    console.log('\n🔧 To delete unused files, run:');
    console.log('node scripts/delete-unused-files.js');
  } else {
    console.log('\n✅ No unused files found!');
  }
  
  // Save results to file
  const results = {
    scanDate: new Date().toISOString(),
    totalFiles: allFiles.length,
    usedFiles: usedFiles.map(f => path.relative(projectRoot, f)),
    unusedFiles: unusedFiles.map(f => ({
      path: path.relative(projectRoot, f),
      size: fs.statSync(f).size
    }))
  };
  
  fs.writeFileSync(
    path.join(projectRoot, 'unused-files-scan-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n💾 Results saved to: unused-files-scan-results.json');
};

scanUnusedFiles().catch(console.error);
