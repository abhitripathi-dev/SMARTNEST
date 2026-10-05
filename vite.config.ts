import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// In-memory Resident Store initialized with existing SmartNest resident data
let residentsData = [
  {
    id: 'res-1',
    society_id: 'e7b1a234-5678-4321-8765-abcdef123456',
    flat_id: 'flat-101',
    flat_number: 'A-101',
    full_name: 'Aarav Sharma',
    phone: '+91 98201 11223',
    email: 'aarav@sharma.in',
    type: 'owner',
    status: 'active',
    avatar_color: 'blue',
    user_id: null,
    created_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'res-2',
    society_id: 'e7b1a234-5678-4321-8765-abcdef123456',
    flat_id: 'flat-102',
    flat_number: 'A-102',
    full_name: 'Pooja Iyer',
    phone: '+91 98403 45678',
    email: 'pooja@iyer.org',
    type: 'tenant',
    status: 'active',
    avatar_color: 'violet',
    user_id: 'usr-demo-resident-003',
    created_at: '2026-02-02T10:00:00Z'
  },
  {
    id: 'res-3',
    society_id: 'e7b1a234-5678-4321-8765-abcdef123456',
    flat_id: 'flat-202',
    flat_number: 'A-202',
    full_name: 'Rohan Deshmukh',
    phone: '+91 98211 44556',
    email: 'rohan.d@corp.com',
    type: 'owner',
    status: 'active',
    avatar_color: 'teal',
    user_id: null,
    created_at: '2026-02-03T10:00:00Z'
  },
  {
    id: 'res-4',
    society_id: 'e7b1a234-5678-4321-8765-abcdef123456',
    flat_id: 'flat-301',
    flat_number: 'B-301',
    full_name: 'Kavita Patel',
    phone: '+91 98922 88990',
    email: 'kavita@patel.me',
    type: 'owner',
    status: 'active',
    avatar_color: 'rose',
    user_id: null,
    created_at: '2026-02-04T10:00:00Z'
  },
  {
    id: 'res-5',
    society_id: 'e7b1a234-5678-4321-8765-abcdef123456',
    flat_id: 'flat-401',
    flat_number: 'B-401',
    full_name: 'Community Administrator',
    phone: '+91 98201 23456',
    email: 'admin@smartnest.community',
    type: 'owner',
    status: 'active',
    avatar_color: 'blue',
    user_id: 'usr-demo-admin-001',
    created_at: '2026-02-05T10:00:00Z'
  }
];

function residentsApiPlugin(): Plugin {
  return {
    name: 'smartnest-residents-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        const method = req.method || 'GET';

        // Check if route matches /api/residents or /api/residents/:id
        if (url.startsWith('/api/residents')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

          if (method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          const parsedUrl = new URL(url, 'http://localhost:5173');
          const pathSegments = parsedUrl.pathname.split('/').filter(Boolean); // ['api', 'residents', ':id'?]
          const residentId = pathSegments[2];

          // Helper to parse JSON body
          const getBody = (): Promise<any> => {
            return new Promise((resolve, reject) => {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', () => {
                try {
                  resolve(body ? JSON.parse(body) : {});
                } catch (err) {
                  reject(err);
                }
              });
            });
          };

          // 1. GET ALL RESIDENTS: GET /api/residents
          if (method === 'GET' && !residentId) {
            res.statusCode = 200;
            res.end(JSON.stringify(residentsData, null, 2));
            return;
          }

          // 2. GET SINGLE RESIDENT: GET /api/residents/:id
          if (method === 'GET' && residentId) {
            const resident = residentsData.find(r => r.id === residentId);
            if (resident) {
              res.statusCode = 200;
              res.end(JSON.stringify(resident, null, 2));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Resident not found', id: residentId }, null, 2));
            }
            return;
          }

          // 3. CREATE RESIDENT: POST /api/residents
          if (method === 'POST' && !residentId) {
            getBody().then(data => {
              const newResident = {
                id: data.id || `res-${Date.now().toString().slice(-4)}`,
                society_id: data.society_id || 'e7b1a234-5678-4321-8765-abcdef123456',
                flat_id: data.flat_id || 'flat-101',
                flat_number: data.flat_number || 'A-101',
                full_name: data.full_name || 'New Resident',
                phone: data.phone || '+91 98000 00000',
                email: data.email || 'resident@smartnest.community',
                type: data.type || 'owner',
                status: data.status || 'active',
                avatar_color: data.avatar_color || 'indigo',
                user_id: data.user_id || null,
                created_at: new Date().toISOString()
              };
              residentsData.push(newResident);
              res.statusCode = 201;
              res.end(JSON.stringify(newResident, null, 2));
            }).catch(() => {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body' }, null, 2));
            });
            return;
          }

          // 4. UPDATE RESIDENT: PUT /api/residents/:id
          if (method === 'PUT' && residentId) {
            getBody().then(data => {
              const index = residentsData.findIndex(r => r.id === residentId);
              if (index !== -1) {
                residentsData[index] = {
                  ...residentsData[index],
                  ...data,
                  id: residentId // Keep original id
                };
                res.statusCode = 200;
                res.end(JSON.stringify(residentsData[index], null, 2));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Resident not found', id: residentId }, null, 2));
              }
            }).catch(() => {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON body' }, null, 2));
            });
            return;
          }

          // 5. DELETE RESIDENT: DELETE /api/residents/:id
          if (method === 'DELETE' && residentId) {
            const index = residentsData.findIndex(r => r.id === residentId);
            if (index !== -1) {
              const deleted = residentsData.splice(index, 1)[0];
              res.statusCode = 200;
              res.end(JSON.stringify({
                message: 'Resident deleted successfully',
                id: residentId,
                deletedResident: deleted
              }, null, 2));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Resident not found', id: residentId }, null, 2));
            }
            return;
          }
        }

        // ==========================================
        // EXPERIMENT 06: JWT AUTHENTICATION ENDPOINTS
        // ==========================================
        if (url === '/api/auth/login' && method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const credentials = JSON.parse(body || '{}');
              if (credentials.username === 'admin' && credentials.password === 'password') {
                // Return signed demo JWT token matching Exp 06
                const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcyNjk2MzIwMCwiZXhwIjoxNzI3MDQ5NjAwfQ.DemoValidSignatureJwtTokenForLabExp06';
                res.statusCode = 200;
                res.end(JSON.stringify({ token }));
              } else {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'Unauthorized: Invalid username or password' }));
              }
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
            }
          });
          return;
        }

        if (url === '/api/hello' && method === 'GET') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          const authHeader = req.headers['authorization'] || '';
          if (authHeader.startsWith('Bearer ') && authHeader.length > 10) {
            res.statusCode = 200;
            res.end('Hello! Access granted via valid JWT Token.');
          } else {
            res.statusCode = 403;
            res.end('Access Denied: Missing or invalid JWT Bearer token.');
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), residentsApiPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

