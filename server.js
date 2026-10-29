/**
 * Foresight Associates — Luxury Architecture & Interior Design
 * Production & Development HTTP Server and Contact API
 * 
 * Supports both standalone Node.js (zero external dependencies required)
 * and optional Express + Nodemailer integration when modules are installed.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const ENQUIRIES_FILE = path.join(__dirname, 'enquiries.json');

// MIME types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

// Rate limiter store: IP -> array of timestamps
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // max 10 requests per window

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimits.get(ip) || []).filter(ts => ts > windowStart);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return true;
  }
  timestamps.push(now);
  rateLimits.set(ip, timestamps);
  return false;
}

// Simple input sanitizer
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // remove dangerous HTML characters
    .slice(0, 3000);
}

// Validate email format
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Ensure enquiries.json exists
function saveEnquiry(enquiry) {
  let list = [];
  try {
    if (fs.existsSync(ENQUIRIES_FILE)) {
      const data = fs.readFileSync(ENQUIRIES_FILE, 'utf-8');
      list = JSON.parse(data);
      if (!Array.isArray(list)) list = [];
    }
  } catch (err) {
    console.error('Error reading enquiries.json:', err);
    list = [];
  }
  list.unshift(enquiry);
  fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

// Request dispatcher
const server = http.createServer((req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // Common security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Handle API: /api/health
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'healthy',
      studio: 'Foresight Associates',
      location: 'Vadodara, Gujarat, India',
      timestamp: new Date().toISOString()
    }));
  }

  // Handle API: /api/contact
  if (pathname === '/api/contact') {
    // CORS headers for API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }

    if (isRateLimited(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: 'Too many submissions. Please wait a few minutes before submitting another enquiry.'
      }));
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.socket.destroy();
      }
    });

    req.on('end', () => {
      try {
        let payload = {};
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
          payload = JSON.parse(body || '{}');
        } else {
          const params = new URLSearchParams(body);
          for (const [k, v] of params.entries()) payload[k] = v;
        }

        // Honeypot spam protection (hidden website field)
        if (payload.website_url || payload.company_fax) {
          console.warn('[SPAM BLOCKED] Honeypot field triggered from IP:', ip);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            message: 'Your enquiry has been received.'
          }));
        }

        const name = sanitizeString(payload.name);
        const email = sanitizeString(payload.email).toLowerCase();
        const phone = sanitizeString(payload.phone);
        const projectType = sanitizeString(payload.projectType || payload.project_type);
        const location = sanitizeString(payload.location);
        const area = sanitizeString(payload.area);
        const budget = sanitizeString(payload.budget);
        const timeline = sanitizeString(payload.timeline);
        const message = sanitizeString(payload.message || payload.description);
        const consent = payload.privacyConsent === true || payload.privacyConsent === 'on' || payload.privacyConsent === 'true';

        // Validation checks
        const errors = {};
        if (!name || name.length < 2) errors.name = 'Please provide your full name.';
        if (!email || !isValidEmail(email)) errors.email = 'Please provide a valid email address.';
        if (!projectType) errors.projectType = 'Please select a project type.';
        if (!location || location.length < 2) errors.location = 'Please state your project city or location.';
        if (!message || message.length < 10) errors.message = 'Please provide a project description (minimum 10 characters).';
        if (!consent) errors.privacyConsent = 'Consent to our privacy policy is required.';

        if (Object.keys(errors).length > 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            error: 'Validation failed',
            details: errors
          }));
        }

        const enquiryRecord = {
          id: 'ENQ-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
          createdAt: new Date().toISOString(),
          name,
          email,
          phone: phone || 'Not provided',
          projectType,
          location,
          area: area || 'Not specified',
          budget: budget || 'Not specified',
          timeline: timeline || 'Flexible',
          message,
          ipHash: crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
        };

        saveEnquiry(enquiryRecord);
        console.log(`[ENQUIRY RECEIVED] ID: ${enquiryRecord.id} | From: ${name} (${email}) | Type: ${projectType} in ${location}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          reference: enquiryRecord.id,
          message: 'Thank you for contacting Foresight Associates. Your enquiry has been received and our design principals will review your project brief.'
        }));

      } catch (err) {
        console.error('API Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'An internal error occurred while processing your enquiry. Please try again.'
        }));
      }
    });

    return;
  }

  // Static File Serving
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  // Check if target is a directory or lacks extension
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // Try appending .html
      if (!path.extname(filePath)) {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath;
          return serveFile(filePath, res);
        }
      }
      return serve404(res);
    }

    if (stats.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      if (fs.existsSync(indexFile)) {
        return serveFile(indexFile, res);
      }
      return serve404(res);
    }

    serveFile(filePath, res);
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Cache static assets (images, fonts) for 1 hour; HTML for 5 minutes
  if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.woff2'].includes(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      return serve404(res);
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function serve404(res) {
  const notFoundPath = path.join(ROOT_DIR, '404.html');
  if (fs.existsSync(notFoundPath)) {
    fs.readFile(notFoundPath, (err, content) => {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found — Foresight Associates');
  }
}

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` FORESIGHT ASSOCIATES — LUXURY ARCHITECTURE STUDIO `);
  console.log(` Server running at: http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Static root: ${ROOT_DIR}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/contact`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

