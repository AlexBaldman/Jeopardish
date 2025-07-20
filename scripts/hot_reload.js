#!/usr/bin/env node

/**
 * Hot Reload Development Server
 * 
 * Carmack principle: "The best debugger is a short compile time"
 * This script provides instant feedback on code changes
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const { exec } = require('child_process');

// Configuration
const PORT = 3001;
const WS_PORT = 3002;
const DEBOUNCE_MS = 100;

// State
let server;
let wss;
let clients = new Set();
let rebuildTimer;

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Inject hot reload client
const hotReloadClient = `
<script>
(function() {
  const ws = new WebSocket('ws://localhost:${WS_PORT}');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
      case 'reload':
        console.log('🔥 Hot reload triggered');
        location.reload();
        break;
        
      case 'css-inject':
        console.log('🎨 CSS hot injected');
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
          const url = new URL(link.href);
          url.searchParams.set('_t', Date.now());
          link.href = url.toString();
        });
        break;
        
      case 'error':
        console.error('Build error:', data.message);
        showError(data.message);
        break;
    }
  };
  
  ws.onclose = () => {
    console.warn('Hot reload disconnected. Attempting reconnect...');
    setTimeout(() => location.reload(), 1000);
  };
  
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff0000;
      color: white;
      padding: 20px;
      font-family: monospace;
      white-space: pre-wrap;
      z-index: 99999;
    \`;
    errorDiv.textContent = message;
    errorDiv.onclick = () => errorDiv.remove();
    document.body.appendChild(errorDiv);
  }
})();
</script>
`;

// Create development server
function createServer() {
  server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    
    const extname = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.mp3': 'audio/mpeg'
    };
    
    const contentType = contentTypes[extname] || 'text/plain';
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end('Server error: ' + error.code);
        }
      } else {
        // Inject hot reload for HTML files
        if (extname === '.html') {
          content = content.toString().replace('</body>', hotReloadClient + '</body>');
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
  
  server.listen(PORT, () => {
    log(`\n🚀 Development server running at http://localhost:${PORT}`, 'green');
  });
}

// Create WebSocket server for hot reload
function createWebSocketServer() {
  wss = new WebSocket.Server({ port: WS_PORT });
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    log('✅ Hot reload client connected', 'cyan');
    
    ws.on('close', () => {
      clients.delete(ws);
      log('❌ Hot reload client disconnected', 'yellow');
    });
  });
}

// Send message to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Build the project
function build(callback) {
  log('🔨 Building...', 'yellow');
  
  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      log('❌ Build failed:', 'red');
      console.error(stderr);
      broadcast({ type: 'error', message: stderr });
      if (callback) callback(error);
    } else {
      log('✅ Build successful', 'green');
      if (callback) callback();
    }
  });
}

// Handle file changes
function handleFileChange(filePath) {
  const relativePath = path.relative('.', filePath);
  log(`📝 File changed: ${relativePath}`, 'blue');
  
  clearTimeout(rebuildTimer);
  
  // CSS files can be hot injected without rebuild
  if (path.extname(filePath) === '.css') {
    broadcast({ type: 'css-inject' });
    return;
  }
  
  // Debounce rebuilds
  rebuildTimer = setTimeout(() => {
    build(() => {
      broadcast({ type: 'reload' });
    });
  }, DEBOUNCE_MS);
}

// Set up file watcher
function setupWatcher() {
  const watcher = chokidar.watch([
    'src/**/*.js',
    'src/**/*.css',
    'index.html',
    'styles.css',
    'css/**/*.css'
  ], {
    ignored: [
      'node_modules/**',
      'dist/**',
      '.git/**',
      '**/*.test.js'
    ],
    persistent: true
  });
  
  watcher
    .on('change', handleFileChange)
    .on('add', (path) => log(`➕ File added: ${path}`, 'green'))
    .on('unlink', (path) => log(`➖ File removed: ${path}`, 'red'));
    
  log('👀 Watching for file changes...', 'cyan');
}

// Performance monitoring
function setupPerformanceMonitoring() {
  setInterval(() => {
    const usage = process.memoryUsage();
    const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
    
    if (usage.heapUsed / usage.heapTotal > 0.9) {
      log(`⚠️  High memory usage: ${mb(usage.heapUsed)}MB / ${mb(usage.heapTotal)}MB`, 'yellow');
    }
  }, 30000); // Check every 30 seconds
}

// Graceful shutdown
function shutdown() {
  log('\n👋 Shutting down...', 'yellow');
  
  clients.forEach(client => client.close());
  wss.close();
  server.close();
  
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Check if ws module is installed
try {
  require.resolve('ws');
} catch (e) {
  log('📦 Installing WebSocket dependency...', 'yellow');
  exec('npm install --save-dev ws chokidar', (error) => {
    if (error) {
      log('❌ Failed to install dependencies', 'red');
      process.exit(1);
    }
    log('✅ Dependencies installed', 'green');
    startServer();
  });
  return;
}

// Start everything
function startServer() {
  log('🔥 Hot Reload Development Server', 'bright');
  log('================================', 'bright');
  
  createServer();
  createWebSocketServer();
  setupWatcher();
  setupPerformanceMonitoring();
  
  // Initial build
  build();
}

startServer();
