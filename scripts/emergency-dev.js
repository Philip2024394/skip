// Emergency Development Server - Bypasses all checks
// Use when node_modules is corrupted or locked

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const projectRoot = process.cwd();
const port = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.tsx': 'text/typescript',
  '.ts': 'text/typescript',
};

const server = createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  let filePath = join(projectRoot, req.url === '/' ? 'index.html' : req.url);

  if (!existsSync(filePath)) {
    // Try to find the file in common locations
    const alternatives = [
      join(projectRoot, 'public', req.url),
      join(projectRoot, 'dist', req.url),
      join(projectRoot, 'src', req.url),
    ];

    for (const alt of alternatives) {
      if (existsSync(alt)) {
        filePath = alt;
        break;
      }
    }
  }

  if (!existsSync(filePath)) {
    // For SPA routing, serve index.html for non-existent files
    if (req.url.startsWith('/admin') || req.url.startsWith('/auth')) {
      filePath = join(projectRoot, 'index.html');
    } else {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }
  }

  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    console.error('Error serving file:', error);
    res.writeHead(500);
    res.end('500 Internal Server Error');
  }
});

server.listen(port, () => {
  console.log('🚨 Emergency Development Server Started!');
  console.log(`📍 http://localhost:${port}`);
  console.log('⚠️  This is a basic static server - no hot reload or bundling');
  console.log('📝 Use this only when node_modules is corrupted');
  console.log('🔧 To fix: Delete node_modules and run npm install');
});

console.log('🛠️  Starting emergency development server...');
