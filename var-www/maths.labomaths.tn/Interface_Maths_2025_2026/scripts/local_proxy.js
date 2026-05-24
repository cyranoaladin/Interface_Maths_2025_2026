// Simple prod-like local server: serves /site and proxies /api|/auth|/groups|/testing to 127.0.0.1:8001
const http = require('http');
const fs = require('fs');
const path = require('path');

const siteRoot = path.resolve(__dirname, '../site');
const apiHost = '127.0.0.1';
const apiPort = 8001;
const port = 8080;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  try {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(parsed.pathname);
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.join(siteRoot, pathname.replace(/^\//, ''));
    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        // SPA fallback
        const indexPath = path.join(siteRoot, 'index.html');
        const stream = fs.createReadStream(indexPath);
        stream.on('error', () => {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not Found');
        });
        stream.on('open', () => {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        });
        stream.pipe(res);
      }
    });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'server_error', detail: String(e) }));
  }
}

function proxyApi(req, res) {
  const options = {
    hostname: apiHost,
    port: apiPort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway', detail: String(err) }));
  });
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.pipe(proxyReq, { end: true });
  } else {
    proxyReq.end();
  }
}

const apiPrefix = /\/(api|auth|groups|testing)\//;

const server = http.createServer((req, res) => {
  if (apiPrefix.test(req.url)) {
    proxyApi(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Local proxy started on http://127.0.0.1:${port}`);
  console.log(`Serving static from: ${siteRoot}`);
  console.log(`Proxying API to: http://${apiHost}:${apiPort}`);
});
