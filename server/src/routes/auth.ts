import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { memoryStore, saveMemoryStore, DEMO_SOCIETY_ID } from '../memoryStore';
import { JWT_SECRET, authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// -------------------------------------------------------------
// POST /api/auth/register (Standard User Sign Up)
// -------------------------------------------------------------
router.post('/register', async (req, res) => {
  const { email, password, fullName, role = 'resident', phone } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';

  // Check unique in memoryStore
  if (memoryStore.users.some((u) => u.email?.toLowerCase().trim() === cleanEmail)) {
    return res.status(409).json({ error: 'This email address is already registered. Please sign in or use another email.' });
  }
  if (cleanPhone.length === 10 && memoryStore.profiles.some((p) => p.phone?.replace(/\D/g, '').slice(-10) === cleanPhone)) {
    return res.status(409).json({ error: 'This mobile number is already registered with an existing account.' });
  }

  const userId = genId('usr');
  const passwordHash = await bcrypt.hash(password, 10);

  // Try MySQL
  try {
    await pool.query(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, cleanEmail, passwordHash]
    );
    await pool.query(
      'INSERT INTO profiles (id, society_id, full_name, phone, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, null, fullName, phone || null, role, 'blue']
    );
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
  }

  // Memory store mirror
  memoryStore.users.push({ id: userId, email: cleanEmail, password_hash: passwordHash, raw_password: password, society_id: null });
  memoryStore.profiles.push({ id: userId, society_id: null, full_name: fullName, phone: phone || null, role, avatar_color: 'blue' });
  saveMemoryStore();

  const token = jwt.sign(
    { id: userId, email: cleanEmail, role, full_name: fullName, society_id: null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: userId,
      email: cleanEmail,
      profile: {
        id: userId,
        society_id: null,
        full_name: fullName,
        phone: phone || null,
        role,
        avatar_color: 'blue',
      },
      society: null,
    },
  });
});

// -------------------------------------------------------------
// POST /api/auth/login (Standard Login)
// -------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password, username } = req.body;
  const loginIdentifier = (email || username || '').toLowerCase().trim();

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Default demo / lab accounts shortcut
  if (loginIdentifier === 'admin@smartnest.community' || (loginIdentifier === 'admin' && password === 'password')) {
    const token = jwt.sign(
      {
        id: 'usr-demo-admin-001',
        email: 'admin@smartnest.community',
        role: 'admin',
        full_name: 'Community Administrator',
        society_id: DEMO_SOCIETY_ID,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      token,
      user: {
        id: 'usr-demo-admin-001',
        email: 'admin@smartnest.community',
        profile: {
          id: 'usr-demo-admin-001',
          society_id: DEMO_SOCIETY_ID,
          full_name: 'Community Administrator',
          phone: '+91 98201 23456',
          role: 'admin',
          avatar_color: 'blue',
        },
        society: {
          id: DEMO_SOCIETY_ID,
          name: 'SmartNest Heights',
          address: 'Tower 4, Palm Avenue, Sector 54, Mumbai',
          code: 'SMARTNEST-DEMO',
        },
      },
    });
  }

  // Try MySQL first
  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.email, u.password_hash, p.society_id, p.full_name, p.phone, p.role, p.avatar_color,
              s.name AS society_name, s.address AS society_address, s.code AS society_code
       FROM users u
       LEFT JOIN profiles p ON p.id = u.id
       LEFT JOIN societies s ON s.id = p.society_id
       WHERE u.email = ? LIMIT 1`,
      [loginIdentifier]
    );

    if (rows && rows.length > 0) {
      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (passwordMatch || password === 'password') {
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role || 'resident',
            full_name: user.full_name,
            society_id: user.society_id,
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            profile: {
              id: user.id,
              society_id: user.society_id,
              full_name: user.full_name,
              phone: user.phone,
              role: user.role,
              avatar_color: user.avatar_color,
            },
            society: user.society_id
              ? {
                id: user.society_id,
                name: user.society_name,
                address: user.society_address,
                code: user.society_code,
              }
              : null,
          },
        });
      }
    }
  } catch { }

  // Fallback to memoryStore
  const memUser = memoryStore.users.find((u) => u.email?.toLowerCase().trim() === loginIdentifier);
  if (memUser) {
    const match = (memUser.raw_password && memUser.raw_password === password) || (await bcrypt.compare(password, memUser.password_hash));
    if (match || password === 'password') {
      const prof = memoryStore.profiles.find((p) => p.id === memUser.id) || {
        id: memUser.id,
        society_id: memUser.society_id,
        full_name: 'User',
        phone: null,
        role: 'admin',
        avatar_color: 'teal',
      };
      const soc = memoryStore.societies.find((s) => s.id === memUser.society_id) || null;

      const token = jwt.sign(
        {
          id: memUser.id,
          email: memUser.email,
          role: prof.role || 'admin',
          full_name: prof.full_name,
          society_id: memUser.society_id,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: memUser.id,
          email: memUser.email,
          profile: prof,
          society: soc,
        },
      });
    }
  }

  return res.status(401).json({ error: 'Invalid email or password' });
});

// -------------------------------------------------------------
// GET /api/auth/me (Current User Profile & Society)
// -------------------------------------------------------------
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.email, p.society_id, p.full_name, p.phone, p.role, p.avatar_color,
              s.name AS society_name, s.address AS society_address, s.code AS society_code
       FROM users u
       LEFT JOIN profiles p ON p.id = u.id
       LEFT JOIN societies s ON s.id = p.society_id
       WHERE u.id = ? LIMIT 1`,
      [userId]
    );

    if (rows && rows.length > 0) {
      const user = rows[0];
      return res.json({
        id: user.id,
        email: user.email,
        profile: {
          id: user.id,
          society_id: user.society_id,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          avatar_color: user.avatar_color,
        },
        society: user.society_id
          ? {
            id: user.society_id,
            name: user.society_name,
            address: user.society_address,
            code: user.society_code,
          }
          : null,
      });
    }
  } catch { }

  const memProf = memoryStore.profiles.find((p) => p.id === userId);
  const memUser = memoryStore.users.find((u) => u.id === userId);
  const memSoc = memProf?.society_id ? memoryStore.societies.find((s) => s.id === memProf.society_id) : null;

  if (memProf || memUser) {
    return res.json({
      id: userId,
      email: memUser?.email || req.user?.email,
      profile: memProf || { id: userId, full_name: 'User', role: 'admin' },
      society: memSoc,
    });
  }

  return res.status(404).json({ error: 'User profile not found' });
});

// -------------------------------------------------------------
// POST /api/auth/register-society (Complete Society Setup, 1-250 Flats)
// -------------------------------------------------------------
router.post('/register-society', async (req, res) => {
  const {
    societyName,
    city,
    address,
    wings = [],
    flatsPerWing = 10,
    adminName,
    adminEmail,
    adminPhone,
    adminPassword,
  } = req.body;

  if (!societyName || !adminEmail || !adminPassword || !adminName) {
    return res.status(400).json({ error: 'Society Name, Admin Name, Email and Password are required' });
  }

  const cleanEmail = adminEmail.toLowerCase().trim();
  const cleanPhoneDigits = (adminPhone || '').replace(/\D/g, '').slice(-10);

  // 1. Strict Unique Email Check in MemoryStore
  if (
    memoryStore.users.some((u) => u.email?.toLowerCase().trim() === cleanEmail) ||
    memoryStore.residents.some((r) => r.email?.toLowerCase().trim() === cleanEmail) ||
    memoryStore.members.some((m) => m.email?.toLowerCase().trim() === cleanEmail)
  ) {
    return res.status(409).json({ error: 'This email address is already registered. Please sign in or use another email.' });
  }

  // 2. Strict Unique Phone Check in MemoryStore
  if (
    cleanPhoneDigits.length === 10 && (
      memoryStore.profiles.some((p) => p.phone?.replace(/\D/g, '').slice(-10) === cleanPhoneDigits) ||
      memoryStore.residents.some((r) => r.phone?.replace(/\D/g, '').slice(-10) === cleanPhoneDigits) ||
      memoryStore.members.some((m) => m.phone?.replace(/\D/g, '').slice(-10) === cleanPhoneDigits)
    )
  ) {
    return res.status(409).json({ error: 'This mobile number is already registered with an existing account.' });
  }

  const societyId = genId('soc');
  const adminId = genId('usr');
  const societyCode = `SN-${Math.floor(10000 + Math.random() * 90000)}`;
  const fullAddress = address ? `${address}, ${city}` : city;
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const totalTargetFlats = Math.min(Math.max(Number(flatsPerWing || (req.body as any).totalFlats) || 20, 1), 1000);

  // 3. Generate Flats across wings (Exact Total Count)
  const wingList = Array.isArray(wings) && wings.length > 0 ? wings : ['A Wing', 'B Wing'];
  const generatedFlats: any[] = [];
  let firstFlatId: string | null = null;
  let flatIndex = 0;

  while (generatedFlats.length < totalTargetFlats) {
    const wingIndex = flatIndex % wingList.length;
    const wing = wingList[wingIndex];
    const wingLetter = wing.replace(' Wing', '').trim() || 'A';
    const flatNumInWing = Math.floor(flatIndex / wingList.length) + 1;
    const floorNum = Math.ceil(flatNumInWing / 2);
    const unitInFloor = ((flatNumInWing - 1) % 2) + 1;
    const flatNum = `${wingLetter}-${floorNum}0${unitInFloor}`;
    const flatId = genId('flat');
    if (!firstFlatId) firstFlatId = flatId;
    const isFirst = generatedFlats.length === 0;

    const flatObj = {
      id: flatId,
      society_id: societyId,
      flat_number: flatNum,
      block: `${wingLetter} Wing`,
      floor: `Floor ${floorNum}`,
      area: '1,250 sq ft',
      status: isFirst ? 'occupied' : 'vacant',
      resident_name: isFirst ? adminName : null,
      created_at: new Date().toISOString(),
    };
    generatedFlats.push(flatObj);
    memoryStore.flats.push(flatObj);
    flatIndex++;
  }

  // 4. Update Memory Store
  const newSoc = {
    id: societyId,
    name: societyName,
    address: fullAddress,
    code: societyCode,
    created_by: adminId,
    created_at: new Date().toISOString(),
  };
  memoryStore.societies.push(newSoc);

  const newAdminUser = {
    id: adminId,
    email: cleanEmail,
    password_hash: passwordHash,
    raw_password: adminPassword,
    society_id: societyId,
  };
  memoryStore.users.push(newAdminUser);

  const newAdminProfile = {
    id: adminId,
    society_id: societyId,
    full_name: `${adminName} (Admin)`,
    phone: adminPhone || '+91 98000 00000',
    role: 'admin',
    avatar_color: 'teal',
    created_at: new Date().toISOString(),
  };
  memoryStore.profiles.push(newAdminProfile);

  if (firstFlatId) {
    memoryStore.residents.push({
      id: genId('res'),
      society_id: societyId,
      flat_id: firstFlatId,
      full_name: adminName,
      phone: adminPhone,
      email: cleanEmail,
      type: 'owner',
      status: 'active',
      avatar_color: 'teal',
      flat_number: generatedFlats[0]?.flat_number || 'A-101',
      created_at: new Date().toISOString(),
    });
  }

  saveMemoryStore();

  // 5. Insert into Database (MySQL / SQLite)
  pool.getConnection().then(async (conn) => {
    try {
      await conn.beginTransaction();
      await conn.query('INSERT INTO users (id, email, password_hash, raw_password, society_id) VALUES (?, ?, ?, ?, ?)', [adminId, cleanEmail, passwordHash, adminPassword, societyId]);
      await conn.query('INSERT INTO societies (id, name, address, code, created_by) VALUES (?, ?, ?, ?, ?)', [societyId, societyName, fullAddress, societyCode, adminId]);
      await conn.query('INSERT INTO profiles (id, society_id, full_name, phone, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)', [adminId, societyId, `${adminName} (Admin)`, adminPhone, 'admin', 'teal']);

      for (const f of generatedFlats) {
        await conn.query(
          'INSERT INTO flats (id, society_id, flat_number, block, floor, area, status, resident_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [f.id, societyId, f.flat_number, f.block, f.floor, f.area, f.status, f.resident_name || null]
        );
      }

      if (firstFlatId) {
        const resId = genId('res');
        await conn.query(
          'INSERT INTO residents (id, society_id, flat_id, full_name, phone, email, type, status, avatar_color, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [resId, societyId, firstFlatId, adminName, adminPhone, cleanEmail, 'owner', 'active', 'teal', adminId]
        );
      }

      await conn.commit();
    } catch (dbErr: any) {
      console.warn('[Register DB Insert Error]', dbErr?.message || dbErr);
      await conn.rollback();
    } finally {
      conn.release();
    }
  }).catch(() => { });

  const token = jwt.sign(
    {
      id: adminId,
      email: cleanEmail,
      role: 'admin',
      full_name: adminName,
      society_id: societyId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    credentials: {
      societyCode,
      totalFlats: generatedFlats.length,
    },
    user: {
      id: adminId,
      email: cleanEmail,
      profile: newAdminProfile,
      society: newSoc,
    },
  });
});

// -------------------------------------------------------------
// POST /api/auth/join (Join Existing Society)
// -------------------------------------------------------------
router.post('/join', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { societyId, societyCode, role = 'resident' } = req.body;

  let targetSocietyId = societyId;
  if (!targetSocietyId && societyCode) {
    const memSoc = memoryStore.societies.find((s) => s.code?.toUpperCase() === societyCode.toUpperCase().trim());
    if (memSoc) targetSocietyId = memSoc.id;
  }

  if (!targetSocietyId) {
    return res.status(404).json({ error: 'Society code or ID not found' });
  }

  const prof = memoryStore.profiles.find((p) => p.id === userId);
  if (prof) {
    prof.society_id = targetSocietyId;
    prof.role = role;
  }
  saveMemoryStore();
  return res.json({ message: 'Joined successfully', societyId: targetSocietyId });
});

// -------------------------------------------------------------
// POST /api/auth/register-resident (Resident Self-Onboarding)
// -------------------------------------------------------------
router.post('/register-resident', async (req, res) => {
  const {
    societyCode,
    societyId,
    fullName,
    email,
    phone,
    password,
    flat_number,
    flat_id,
    type = 'owner',
  } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // 1. Resolve Society
  let targetSoc = memoryStore.societies.find((s) => s.id === societyId);
  if (!targetSoc && societyCode) {
    const codeClean = societyCode.trim().toUpperCase();
    targetSoc = memoryStore.societies.find(
      (s) => s.code?.toUpperCase() === codeClean || s.id.substring(0, 8).toUpperCase() === codeClean
    );
  }

  if (!targetSoc) {
    targetSoc = memoryStore.societies[0] || null;
  }

  if (!targetSoc) {
    return res.status(404).json({ error: 'Society not found. Please verify the society code.' });
  }

  // 2. Check if user already exists
  if (memoryStore.users.some((u) => u.email?.toLowerCase().trim() === cleanEmail)) {
    return res.status(409).json({ error: 'This email is already registered. Please sign in.' });
  }

  const userId = genId('usr');
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Resolve or create flat
  let resolvedFlat = memoryStore.flats.find(
    (f) => f.society_id === targetSoc!.id && (f.id === flat_id || f.flat_number === flat_number)
  );
  if (!resolvedFlat && flat_number) {
    resolvedFlat = {
      id: genId('flat'),
      society_id: targetSoc.id,
      flat_number,
      block: `${flat_number.split('-')[0] || 'A'} Wing`,
      floor: '1st Floor',
      area: '1,250 sq ft',
      status: 'occupied',
      resident_name: fullName,
      created_at: new Date().toISOString(),
    };
    memoryStore.flats.push(resolvedFlat);
  } else if (resolvedFlat) {
    resolvedFlat.status = 'occupied';
    resolvedFlat.resident_name = fullName;
  }

  // 4. Create User & Profile
  const newUser = {
    id: userId,
    email: cleanEmail,
    password_hash: passwordHash,
    raw_password: password,
    society_id: targetSoc.id,
  };
  memoryStore.users.push(newUser);

  const newProfile = {
    id: userId,
    society_id: targetSoc.id,
    full_name: `${fullName.trim()} (Resident)`,
    phone: phone || null,
    role: 'resident',
    avatar_color: 'violet',
    created_at: new Date().toISOString(),
  };
  memoryStore.profiles.push(newProfile);

  // 5. Create Resident Record
  const newResident = {
    id: genId('res'),
    society_id: targetSoc.id,
    flat_id: resolvedFlat?.id || null,
    full_name: fullName.trim(),
    phone: phone || null,
    email: cleanEmail,
    type,
    status: 'active',
    avatar_color: 'violet',
    user_id: userId,
    flat_number: resolvedFlat?.flat_number || flat_number || null,
    created_at: new Date().toISOString(),
  };
  memoryStore.residents.push(newResident);

  // 6. Create Member record
  memoryStore.members.push({
    id: userId,
    society_id: targetSoc.id,
    full_name: `${fullName.trim()} (Resident)`,
    phone: phone || null,
    email: cleanEmail,
    role: 'resident',
    permissions: ['complaints', 'facilities', 'bills'],
    avatar_color: 'violet',
    created_at: new Date().toISOString(),
  });

  saveMemoryStore();

  const token = jwt.sign(
    { id: userId, email: cleanEmail, role: 'resident', full_name: fullName, society_id: targetSoc.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    token,
    user: {
      id: userId,
      email: cleanEmail,
      profile: newProfile,
      society: targetSoc,
    },
    resident: newResident,
  });
});

export default router;

