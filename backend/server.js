/**
 * AGRI CRAFT-AI - REST API Server (server.js)
 * "Right Crop. Right Time. Right Action. Right Support."
 * 
 * Supports Express.js with Helmet & CORS when installed,
 * and seamlessly provides a zero-dependency Native Node HTTP REST fallback
 * so the server can run instantly in any environment.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Database configuration
const db = require('./config/db');

// Controllers & Services
const farmerController = require('./controllers/farmerController');
const cropController = require('./controllers/cropController');
const marketController = require('./controllers/marketController');
const loanController = require('./controllers/loanController');
const schemeController = require('./controllers/schemeController');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const ROOT_DIR = path.resolve(__dirname, '../');

// Check if Express and middleware packages are installed
let expressApp = null;
try {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`[${timestamp}] [Express] ${req.method} ${req.url}`);
    next();
  });

  // Serve Frontend Static Assets
  app.use(express.static(ROOT_DIR));

  // Health endpoint
  app.get('/api/health', async (req, res) => {
    const dbStatus = await db.testConnection();
    res.json({
      status: 'online',
      runtime: 'Express.js',
      app: 'AGRI CRAFT-AI REST API',
      tagline: 'Right Crop. Right Time. Right Action. Right Support.',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      endpoints: {
        farmers: '/api/farmers',
        crops: '/api/crops',
        marketPrices: '/api/market-prices',
        loans: '/api/loans',
        loanRecommendations: '/api/loan-recommendations',
        governmentSchemes: '/api/government-schemes'
      }
    });
  });

  // Routes
  const farmerRoutes = require('./routes/farmerRoutes');
  const cropRoutes = require('./routes/cropRoutes');
  const marketRoutes = require('./routes/marketRoutes');
  const loanRoutes = require('./routes/loanRoutes');
  const schemeRoutes = require('./routes/schemeRoutes');

  app.use('/api/farmers', farmerRoutes);
  app.use('/api/crops', cropRoutes);
  app.use('/api/market-prices', marketRoutes);
  app.use('/api/loans', loanRoutes);
  app.post('/api/loan-recommendations', loanController.createLoanRecommendation);
  app.get('/api/loan-recommendations/:farmerId', loanController.getRecommendationsByFarmer);
  app.use('/api/government-schemes', schemeRoutes);

  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API route ${req.method} ${req.url} not found.` });
  });

  // Error Handler
  app.use((err, req, res, next) => {
    console.error('[Express Error]', err.message);
    res.status(500).json({ success: false, error: 'Internal server error processing agricultural request.' });
  });

  expressApp = app;
} catch (e) {
  // Express not yet installed; native HTTP server fallback will be used
}

// -----------------------------------------------------------------------------
// Native HTTP Server Implementation (Runs out-of-the-box without npm dependencies)
// -----------------------------------------------------------------------------
function serveNativeStatic(req, res, pathname) {
  let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function wrapResponse(res) {
  res.status = function(code) {
    res.statusCode = code;
    return res;
  };
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.end(JSON.stringify(data));
  };
  return res;
}

const nativeServer = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method.toUpperCase();

  // CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // Request logging
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${timestamp}] [NativeHTTP] ${method} ${pathname}`);

  wrapResponse(res);
  req.query = parsed.query || {};
  req.params = {};

  if (method === 'POST' || method === 'PUT') {
    req.body = await parseJsonBody(req);
  } else {
    req.body = {};
  }

  // Route Handling
  try {
    // 1. Health check
    if (pathname === '/api/health' && method === 'GET') {
      const dbStatus = await db.testConnection();
      return res.json({
        status: 'online',
        runtime: 'Node Native HTTP (Express available upon npm install)',
        app: 'AGRI CRAFT-AI REST API',
        tagline: 'Right Crop. Right Time. Right Action. Right Support.',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        endpoints: {
          farmers: '/api/farmers',
          crops: '/api/crops',
          marketPrices: '/api/market-prices',
          loans: '/api/loans',
          loanRecommendations: '/api/loan-recommendations',
          governmentSchemes: '/api/government-schemes'
        }
      });
    }

    // 2. Farmers Routes
    if (pathname === '/api/farmers' && method === 'POST') {
      return await farmerController.createFarmer(req, res);
    }
    const farmerMatch = pathname.match(/^\/api\/farmers\/(\d+)$/);
    if (farmerMatch) {
      req.params.id = farmerMatch[1];
      if (method === 'GET') return await farmerController.getFarmerById(req, res);
      if (method === 'PUT') return await farmerController.updateFarmer(req, res);
    }

    // 3. Crops Routes
    if (pathname === '/api/crops' && method === 'POST') {
      return await cropController.createCrop(req, res);
    }
    const cropFarmerMatch = pathname.match(/^\/api\/crops\/(\d+)$/);
    if (cropFarmerMatch && method === 'GET') {
      req.params.farmerId = cropFarmerMatch[1];
      return await cropController.getCropsByFarmer(req, res);
    }

    // 4. Market Prices Routes
    if (pathname === '/api/market-prices' && method === 'GET') {
      return await marketController.getPrices(req, res);
    }
    if (pathname === '/api/market-prices' && method === 'POST') {
      return await marketController.createPrice(req, res);
    }

    // 5. Loan Routes
    if (pathname === '/api/loans' && method === 'GET') {
      return await loanController.getLoans(req, res);
    }
    if ((pathname === '/api/loan-recommendations' || pathname === '/api/loans/recommendations') && method === 'POST') {
      return await loanController.createLoanRecommendation(req, res);
    }
    const loanRecMatch = pathname.match(/^\/api\/loan-recommendations\/(\d+)$/) || pathname.match(/^\/api\/loans\/recommendations\/(\d+)$/);
    if (loanRecMatch && method === 'GET') {
      req.params.farmerId = loanRecMatch[1];
      return await loanController.getRecommendationsByFarmer(req, res);
    }

    // 6. Government Schemes Routes
    if (pathname === '/api/government-schemes' && method === 'GET') {
      return await schemeController.getSchemes(req, res);
    }
    const schemeMatch = pathname.match(/^\/api\/government-schemes\/match\/(\d+)$/);
    if (schemeMatch && method === 'GET') {
      req.params.farmerId = schemeMatch[1];
      return await schemeController.matchSchemesForFarmer(req, res);
    }

    // If API route not matched
    if (pathname.startsWith('/api/')) {
      return res.status(404).json({ success: false, error: `API route ${method} ${pathname} not found.` });
    }

    // Static Frontend File Serving
    serveNativeStatic(req, res, pathname);

  } catch (routeErr) {
    console.error('[Route Error]', routeErr);
    res.status(500).json({ success: false, error: 'Internal server error processing agricultural request.' });
  }
});

// -----------------------------------------------------------------------------
// Server Initialization
// -----------------------------------------------------------------------------
function startServer() {
  const server = expressApp || nativeServer;
  const isExpress = Boolean(expressApp);

  const runningServer = server.listen(PORT, async () => {
    console.log('================================================================');
    console.log(`🌾 AGRI CRAFT-AI Backend Server running on port ${PORT}`);
    console.log(`⚡ Runtime Engine: ${isExpress ? 'Express.js + Middleware' : 'Node.js Native HTTP'}`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`🩺 Health API: http://localhost:${PORT}/api/health`);
    console.log('================================================================');

    const dbTest = await db.testConnection();
    if (dbTest.connected) {
      console.log(`✅ PostgreSQL Connected successfully (DB: ${dbTest.database})`);
    } else {
      console.log(`⚠️  PostgreSQL Notice: ${dbTest.error || dbTest.message}`);
      console.log(`ℹ️  Note: Backend operates with resilient fallback until PostgreSQL is active.`);
    }
  });

  runningServer.on('error', (err) => {
    console.error('Server error on startup:', err.message);
  });

  return runningServer;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app: expressApp || nativeServer,
  startServer
};
