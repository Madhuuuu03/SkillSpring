/**
 * SkillSpring - Zero-dependency Local Static Development Server
 * Usage: node serve.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json'
};

const BLOCKED_EXTENSIONS = new Set([
  '.py', '.pyc', '.pyd', '.pyo',
  '.db', '.sqlite', '.sqlite3', '.bak',
  '.env', '.git', '.gitignore',
  '.bat', '.cmd', '.sh', '.ps1',
  '.md', '.jsonl', '.txt', '.log'
]);

const BLOCKED_FILES = new Set([
  '.env', '.env.example', '.gitignore', 'readme.md', 'serve.js', 'run_backend.bat',
  'skillspring.db', 'skillspring.db.bak', 'app.py', 'database.py'
]);

const server = http.createServer((req, res) => {
  // Reject null bytes or encoded path injection
  if (req.url.includes('\0') || req.url.includes('%00')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid request path', success: false }));
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  // Normalize path and detect directory traversal / dot files
  const normalized = path.normalize(reqPath);
  const segments = normalized.split(/[\\\/]/).filter(Boolean);

  if (segments.some(seg => seg.startsWith('.'))) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Access to hidden or configuration files is forbidden', success: false }));
  }

  const resolved = path.resolve(__dirname, '.' + (normalized.startsWith(path.sep) ? normalized : path.sep + normalized));

  // Enforce boundary strictly inside workspace root
  if (!resolved.startsWith(__dirname + path.sep) && resolved !== __dirname) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Path traversal forbidden', success: false }));
  }

  const ext = path.extname(resolved).toLowerCase();
  const baseName = path.basename(resolved).toLowerCase();

  // Block sensitive extensions and sensitive configuration files
  if (BLOCKED_EXTENSIONS.has(ext) || BLOCKED_FILES.has(baseName)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Access to backend files is forbidden', success: false }));
  }

  // Check direct file existence
  fs.stat(resolved, (err, stats) => {
    if (!err && stats.isFile()) {
      if (!MIME_TYPES[ext]) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'File type not permitted', success: false }));
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] });
      return fs.createReadStream(resolved).pipe(res);
    }

    // Check extensionless HTML URLs (e.g., /dashboard -> /dashboard.html)
    const htmlCandidate = resolved + '.html';
    if (htmlCandidate.startsWith(__dirname + path.sep)) {
      fs.stat(htmlCandidate, (htmlErr, htmlStats) => {
        if (!htmlErr && htmlStats.isFile()) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          return fs.createReadStream(htmlCandidate).pipe(res);
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Resource not found', path: reqPath }));
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Resource not found', path: reqPath }));
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SkillSpring Frontend Server Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`✨ Open http://localhost:${PORT} in your web browser`);
  console.log(`Press Ctrl+C to terminate the server`);
  console.log(`======================================================\n`);
});
