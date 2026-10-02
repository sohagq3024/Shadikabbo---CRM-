import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Ensure data folder exists
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'crm_store.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_shadikabbo_salt_2026').digest('hex');
}

// Initial DB initialization
interface SystemUser {
  id: string;
  phone: string;
  name: string;
  role: 'Super Admin' | 'CRO' | 'MK';
  passwordHash: string;
}

interface DatabaseSchema {
  users: SystemUser[];
  traffics: any[];
  leads: any[];
  paymentRequests: any[];
  payments: any[];
  sessions: { token: string; userId: string; createdAt: number }[];
  nextSerial: number;
  nextLeadSerial: number;
}

function computeLeadCompleteness(data: any): { percentage: number; stars: number } {
  let score = 0;
  // Part 1: Mandatory for Lead (10% + 10% = 20%) -> Guarantees 20% & 1 Star
  if (data.name && String(data.name).trim()) score += 10;
  if (data.phone && String(data.phone).trim()) score += 10;

  // Part 2: Specific Optional Fields (each adds 8% -> 10 options * 8% = 80%)
  if (data.profession && String(data.profession).trim()) score += 8;
  if (data.dateOfBirth && String(data.dateOfBirth).trim()) score += 8;
  if (data.maritalStatus && String(data.maritalStatus).trim()) score += 8;
  if (data.gender && String(data.gender).trim()) score += 8;
  if (data.height && String(data.height).trim()) score += 8;
  if (data.religion && String(data.religion).trim()) score += 8;
  if (data.qualification && String(data.qualification).trim()) score += 8;
  if (
    (data.presentCity && String(data.presentCity).trim()) ||
    (data.permanentCity && String(data.permanentCity).trim())
  ) {
    score += 8;
  }
  if (Array.isArray(data.images) && data.images.length > 0) score += 8;
  if (data.pdf && (data.pdf.dataUrl || data.pdf.name)) score += 8;

  const percentage = Math.min(100, Math.max(0, score));
  // 1st part filled = 20% -> 1 Star (★☆☆☆☆)
  // 20-39% = 1 Star, 40-59% = 2 Stars, 60-79% = 3 Stars, 80-99% = 4 Stars, 100% = 5 Stars
  const stars = percentage < 20 ? 0 : Math.min(5, Math.floor(percentage / 20));
  return { percentage, stars };
}

function loadDB(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [
        {
          id: 'usr_super_admin',
          phone: '01723867646',
          name: 'Sohag',
          role: 'Super Admin',
          passwordHash: hashPassword('sohag12345'),
        },
        {
          id: 'usr_mk_1',
          phone: '01700000001',
          name: 'MK - Tanvir Ahmed',
          role: 'MK',
          passwordHash: hashPassword('mk12345'),
        },
        {
          id: 'usr_mk_2',
          phone: '01700000002',
          name: 'MK - Rashedul Islam',
          role: 'MK',
          passwordHash: hashPassword('mk12345'),
        },
        {
          id: 'usr_cro_1',
          phone: '01800000001',
          name: 'CRO - Farhana Khan',
          role: 'CRO',
          passwordHash: hashPassword('cro12345'),
        },
        {
          id: 'usr_cro_2',
          phone: '01800000002',
          name: 'CRO - Mahmud Hasan',
          role: 'CRO',
          passwordHash: hashPassword('cro12345'),
        },
      ],
      traffics: [],
      leads: [],
      paymentRequests: [],
      payments: [],
      sessions: [],
      nextSerial: 1,
      nextLeadSerial: 1,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.leads) parsed.leads = [];
    if (!parsed.nextLeadSerial) parsed.nextLeadSerial = (parsed.leads.length || 0) + 1;
    return parsed;
  } catch (err) {
    console.error('Error reading db file, resetting:', err);
    return {
      users: [],
      traffics: [],
      leads: [],
      paymentRequests: [],
      payments: [],
      sessions: [],
      nextSerial: 1,
      nextLeadSerial: 1,
    };
  }
}

function saveDB(data: DatabaseSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Session validation middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing session token' });
  }

  const token = authHeader.split(' ')[1];
  const db = loadDB();
  const session = db.sessions.find(s => s.token === token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  (req as any).user = user;
  next();
}

// --- AUTHENTICATION API ---
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Official phone number and password are required' });
  }

  const db = loadDB();
  const cleanPhone = String(phone).trim();
  const user = db.users.find(u => u.phone === cleanPhone);

  if (!user) {
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }

  const hashed = hashPassword(password);
  if (user.passwordHash !== hashed) {
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: Date.now(),
  });
  saveDB(db);

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    },
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    },
  });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  const db = loadDB();
  db.sessions = db.sessions.filter(s => s.token !== token);
  saveDB(db);
  res.json({ success: true });
});

// --- USERS / ROLES API ---
app.get('/api/users', authMiddleware, (req, res) => {
  const db = loadDB();
  const role = req.query.role as string;
  let list = db.users.map(u => ({ id: u.id, phone: u.phone, name: u.name, role: u.role }));
  if (role) {
    list = list.filter(u => u.role === role);
  }
  res.json(list);
});

// --- LEADS API ---
// 1. Get all active leads
app.get('/api/leads', authMiddleware, (req, res) => {
  const db = loadDB();
  const activeLeads = (db.leads || [])
    .filter(l => l.status !== 'trash' && l.status !== 'converted')
    .sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0))
    .map(l => {
      const { percentage, stars } = computeLeadCompleteness(l);
      return {
        ...l,
        completeness: percentage,
        stars,
        createdBy: l.createdBy || 'Sohag',
        creatorRole: l.creatorRole || 'Super Admin',
      };
    });
  res.json(activeLeads);
});

// 2. Create a new lead
app.post('/api/leads', authMiddleware, (req, res) => {
  const data = req.body;
  const db = loadDB();

  if (!data.name || !data.phone) {
    return res.status(400).json({ error: 'Name and Phone Number are required' });
  }

  // File type and security validation
  if (data.pdf) {
    if (!data.pdf.name || !data.pdf.name.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Security validation failed: Only authentic PDF format (.pdf) is permitted for PDF document upload.' });
    }
  }

  const nextSerial = db.nextLeadSerial || ((db.leads || []).length + 1);
  db.nextLeadSerial = nextSerial + 1;

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const leadId = `LD-${String(nextSerial).padStart(4, '0')}`;

  const creator = (req as any).user;
  const creatorName = creator?.name || 'Sohag';
  const creatorRole = creator?.role || 'Super Admin';

  const { percentage, stars } = computeLeadCompleteness(data);

  const newLead = {
    id: leadId,
    serialNumber: nextSerial,
    createdAt: formattedDate,
    createdTimestamp: Date.now(),
    name: String(data.name).trim(),
    phone: String(data.phone).trim(),
    email: data.email ? String(data.email).trim() : '',
    profession: data.profession || '',
    dateOfBirth: data.dateOfBirth || '',
    maritalStatus: data.maritalStatus || '',
    gender: data.gender || '',
    height: data.height || '',
    religion: data.religion || '',
    qualification: data.qualification || '',
    presentCity: data.presentCity || '',
    presentCountry: data.presentCountry || 'Bangladesh',
    permanentCity: data.permanentCity || '',
    permanentCountry: data.permanentCountry || 'Bangladesh',
    images: Array.isArray(data.images) ? data.images : [],
    pdf: data.pdf || null,
    createdBy: creatorName,
    creatorRole: creatorRole,
    status: 'active',
    completeness: percentage,
    stars,
  };

  if (!db.leads) db.leads = [];
  db.leads.push(newLead);
  saveDB(db);
  res.status(201).json(newLead);
});

// 3. Update an existing lead
app.put('/api/leads/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = loadDB();

  const index = (db.leads || []).findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const existing = db.leads[index];
  const merged = {
    ...existing,
    ...updates,
    id: existing.id,
    serialNumber: existing.serialNumber,
    createdAt: existing.createdAt,
    createdTimestamp: existing.createdTimestamp,
    createdBy: existing.createdBy,
    creatorRole: existing.creatorRole,
  };

  const { percentage, stars } = computeLeadCompleteness(merged);
  merged.completeness = percentage;
  merged.stars = stars;

  db.leads[index] = merged;
  saveDB(db);
  res.json(merged);
});

// 4. Move lead to trash
app.put('/api/leads/:id/remove', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  const lead = (db.leads || []).find(l => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  lead.status = 'trash';
  saveDB(db);
  res.json({ success: true, message: 'Lead moved to trash' });
});

// 5. Convert lead to traffic
app.post('/api/leads/:id/convert-traffic', authMiddleware, (req, res) => {
  const { id } = req.params;
  const trafficData = req.body;
  const db = loadDB();

  const leadIndex = (db.leads || []).findIndex(l => l.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const lead = db.leads[leadIndex];

  // Validation layer: prevent transfer to Traffic section unless all mandatory traffic-specific fields are filled
  const missingRequirements: string[] = [];

  const finalName = String(trafficData.name || lead.name || '').trim();
  const finalPhone = String(trafficData.phone || lead.phone || '').trim();
  const finalEmail = String(trafficData.email || lead.email || '').trim();
  const finalAssignBy = String(trafficData.assignBy || '').trim();
  const finalProfession = String(trafficData.profession || lead.profession || '').trim();
  const finalJobType = String(trafficData.jobType || lead.jobType || '').trim();
  const finalDateOfBirth = String(trafficData.dateOfBirth || lead.dateOfBirth || '').trim();
  const finalMaritalStatus = String(trafficData.maritalStatus || lead.maritalStatus || '').trim();
  const finalGender = String(trafficData.gender || lead.gender || '').trim();
  const finalBodyColor = String(trafficData.bodyColor || lead.bodyColor || '').trim();
  const finalHeight = String(trafficData.height || lead.height || '').trim();
  const finalReligion = String(trafficData.religion || lead.religion || '').trim();
  const finalBloodGroup = String(trafficData.bloodGroup || lead.bloodGroup || '').trim();
  const finalQualification = String(trafficData.qualification || lead.qualification || '').trim();
  const finalRequirement = String(trafficData.requirement || lead.requirement || '').trim();
  const finalPresentCity = String(trafficData.presentCity || lead.presentCity || '').trim();
  const finalPresentCountry = String(trafficData.presentCountry || lead.presentCountry || '').trim();
  const finalPermanentCity = String(trafficData.permanentCity || lead.permanentCity || '').trim();
  const finalPermanentCountry = String(trafficData.permanentCountry || lead.permanentCountry || '').trim();
  const finalImages = Array.isArray(trafficData.images) && trafficData.images.length > 0 ? trafficData.images : (lead.images || []);
  const finalPdf = trafficData.pdf || lead.pdf || null;
  const price = Number(trafficData.price) || 0;

  if (!finalName) missingRequirements.push('Candidate Name');
  if (!finalPhone) missingRequirements.push('Phone Number');
  if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) missingRequirements.push('Valid Email Address');
  if (!finalAssignBy) missingRequirements.push('Assign By (MK Role Account)');
  if (!finalProfession) missingRequirements.push('Profession');
  if (!finalJobType) missingRequirements.push('Job Type');
  if (!finalDateOfBirth) missingRequirements.push('Date of Birth');
  if (!finalMaritalStatus) missingRequirements.push('Marital Status');
  if (!finalGender) missingRequirements.push('Gender');
  if (!finalBodyColor) missingRequirements.push('Body Color');
  if (!finalHeight) missingRequirements.push('Height');
  if (!finalReligion) missingRequirements.push('Religion');
  if (!finalBloodGroup) missingRequirements.push('Blood Group');
  if (!finalQualification) missingRequirements.push('Educational Qualification');
  if (!finalRequirement) missingRequirements.push('Partner Requirement');
  if (!finalPresentCity || !finalPresentCountry) missingRequirements.push('Present Address (City & Country)');
  if (!finalPermanentCity || !finalPermanentCountry) missingRequirements.push('Permanent Address (City & Country)');
  if (!Array.isArray(finalImages) || finalImages.length === 0) missingRequirements.push('Picture Upload (at least 1 image)');
  if (!finalPdf || (!finalPdf.dataUrl && !finalPdf.name)) missingRequirements.push('PDF Biodata Document');
  if (price <= 0) missingRequirements.push('Valid Package Price');

  if (missingRequirements.length > 0) {
    return res.status(400).json({
      error: `Transfer to Traffic blocked: ${missingRequirements.length} mandatory requirement(s) are missing.`,
      missingRequirements,
    });
  }

  // Merge lead data with traffic conversion data
  const serialNumber = db.nextSerial || 1;
  db.nextSerial = serialNumber + 1;

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const trafficId = `SK-${String(serialNumber).padStart(4, '0')}`;

  const price = Number(trafficData.price) || 0;
  const discount = Number(trafficData.discount) || 0;
  const paidAmount = Number(trafficData.paidAmount) || 0;
  const dueAmount = Math.max(0, price - discount - paidAmount);
  const afterMarriageFee = Number(trafficData.afterMarriageFee) || 0;

  const creator = (req as any).user;
  const creatorName = creator?.name || lead.createdBy || 'Sohag';
  const creatorRole = creator?.role || lead.creatorRole || 'Super Admin';

  const newTraffic = {
    id: trafficId,
    serialNumber,
    createdAt: formattedDate,
    createdTimestamp: Date.now(),
    name: trafficData.name || lead.name,
    phone: trafficData.phone || lead.phone,
    email: trafficData.email || lead.email || '',
    createdBy: creatorName,
    creatorRole: creatorRole,
    assignBy: trafficData.assignBy || '',
    profession: trafficData.profession || lead.profession || '',
    jobType: trafficData.jobType || 'Full Time',
    dateOfBirth: trafficData.dateOfBirth || lead.dateOfBirth || '',
    maritalStatus: trafficData.maritalStatus || lead.maritalStatus || '',
    gender: trafficData.gender || lead.gender || '',
    bodyColor: trafficData.bodyColor || 'Fair',
    height: trafficData.height || lead.height || '',
    religion: trafficData.religion || lead.religion || '',
    bloodGroup: trafficData.bloodGroup || 'O+',
    qualification: trafficData.qualification || lead.qualification || '',
    requirement: trafficData.requirement || lead.requirement || '',
    presentCity: trafficData.presentCity || lead.presentCity || '',
    presentCountry: trafficData.presentCountry || lead.presentCountry || 'Bangladesh',
    permanentCity: trafficData.permanentCity || lead.permanentCity || '',
    permanentCountry: trafficData.permanentCountry || lead.permanentCountry || 'Bangladesh',
    images: Array.isArray(trafficData.images) && trafficData.images.length > 0 ? trafficData.images : (lead.images || []),
    pdf: trafficData.pdf || lead.pdf || null,
    package: trafficData.package || 'Gold',
    price,
    discount,
    dueAmount,
    paidAmount,
    paymentMethod: trafficData.paymentMethod || 'bKash',
    afterMarriageFee,
    paymentStatus: 'pending',
    assignedTo: trafficData.assignBy ? { name: trafficData.assignBy, role: 'MK' } : null,
    status: 'active',
    convertedFromLeadId: lead.id,
  };

  db.traffics.push(newTraffic);

  // Generate Payment Request
  const newPaymentRequest = {
    id: `PR-${String(db.paymentRequests.length + 1).padStart(4, '0')}`,
    trafficId: newTraffic.id,
    trafficName: newTraffic.name,
    phone: newTraffic.phone,
    date: formattedDate,
    paidAmount,
    dueAmount,
    afterMarriageFee,
    package: newTraffic.package,
    paymentMethod: newTraffic.paymentMethod,
    assignedBy: newTraffic.assignBy || creatorName,
    createdBy: creatorName,
    creatorRole: creatorRole,
    role: creatorRole,
    status: 'pending',
    images: newTraffic.images || [],
    gender: newTraffic.gender || '',
  };
  db.paymentRequests.push(newPaymentRequest);

  // Mark lead as converted
  lead.status = 'converted';
  lead.convertedToTrafficId = newTraffic.id;

  saveDB(db);
  res.json({ success: true, traffic: newTraffic, lead });
});

// --- TRAFFIC API ---
app.get('/api/traffic', authMiddleware, (req, res) => {
  const db = loadDB();
  // Filter out records marked as trash
  const activeTraffics = (db.traffics || [])
    .filter(t => t.status !== 'trash')
    // Sequential order (1, 2, 3...) with newest at the bottom as requested
    .sort((a, b) => a.serialNumber - b.serialNumber)
    .map(t => ({
      ...t,
      createdBy: t.createdBy || 'Sohag',
      creatorRole: t.creatorRole || 'Super Admin',
    }));

  res.json(activeTraffics);
});

app.post('/api/traffic', authMiddleware, (req, res) => {
  const data = req.body;
  const db = loadDB();

  // Basic validation
  if (!data.name || !data.phone) {
    return res.status(400).json({ error: 'Name and Phone Number are required' });
  }

  // File type and security validation
  if (data.pdf) {
    if (!data.pdf.name || !data.pdf.name.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Security validation failed: Only authentic PDF format (.pdf) is permitted for PDF document upload.' });
    }
    if (data.pdf.dataUrl && !data.pdf.dataUrl.startsWith('data:application/pdf')) {
      return res.status(400).json({ error: 'Security validation failed: PDF data payload is invalid or spoofed.' });
    }
  }

  if (Array.isArray(data.images)) {
    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      if (typeof img !== 'string' || !img.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Security validation failed: Uploaded file is not an image.' });
      }
    }
  }

  const serialNumber = db.nextSerial || 1;
  db.nextSerial = serialNumber + 1;

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const trafficId = `SK-${String(serialNumber).padStart(4, '0')}`;

  const price = Number(data.price) || 0;
  const discount = Number(data.discount) || 0;
  const paidAmount = Number(data.paidAmount) || 0;
  const dueAmount = Math.max(0, price - discount - paidAmount);
  const afterMarriageFee = Number(data.afterMarriageFee) || 0;

  // The creator is the exact authenticated user account who submitted this traffic into CRM
  const creator = (req as any).user;
  const creatorName = creator?.name || data.createdByName || 'Sohag';
  const creatorRole = creator?.role || data.createdByRole || 'Super Admin';

  const newTraffic = {
    id: trafficId,
    serialNumber,
    createdAt: formattedDate,
    createdTimestamp: Date.now(),
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    // Exact CRM Account Person who added this traffic
    createdBy: creatorName,
    creatorRole: creatorRole,
    // Assigned MK Account
    assignBy: data.assignBy || '',
    profession: data.profession || '',
    jobType: data.jobType || '',
    dateOfBirth: data.dateOfBirth || '',
    maritalStatus: data.maritalStatus || '',
    gender: data.gender || '',
    bodyColor: data.bodyColor || '',
    height: data.height || '',
    religion: data.religion || '',
    bloodGroup: data.bloodGroup || '',
    qualification: data.qualification || '',
    requirement: data.requirement || '',
    // Address
    presentCity: data.presentCity || '',
    presentCountry: data.presentCountry || '',
    permanentCity: data.permanentCity || '',
    permanentCountry: data.permanentCountry || '',
    // Uploads
    images: Array.isArray(data.images) ? data.images : [],
    pdf: data.pdf || null,
    // Payment
    package: data.package || '',
    price,
    discount,
    dueAmount,
    paidAmount,
    paymentMethod: data.paymentMethod || '',
    afterMarriageFee,
    // Status
    paymentStatus: 'pending',
    assignedTo: data.assignBy ? { name: data.assignBy, role: 'MK' } : null,
    status: 'active',
  };

  db.traffics.push(newTraffic);

  // When a Traffic form is submitted, it becomes a Payment Request in Payment section
  const newPaymentRequest = {
    id: `PR-${String(db.paymentRequests.length + 1).padStart(4, '0')}`,
    trafficId: newTraffic.id,
    trafficName: newTraffic.name,
    phone: newTraffic.phone,
    date: formattedDate,
    paidAmount,
    dueAmount,
    afterMarriageFee,
    package: newTraffic.package,
    paymentMethod: newTraffic.paymentMethod,
    assignedBy: newTraffic.assignBy || creatorName,
    createdBy: creatorName,
    creatorRole: creatorRole,
    role: creatorRole,
    status: 'pending',
    images: newTraffic.images || [],
    gender: newTraffic.gender || '',
  };
  db.paymentRequests.push(newPaymentRequest);

  saveDB(db);
  res.status(201).json(newTraffic);
});

// Update traffic profile
app.put('/api/traffic/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = loadDB();

  const index = db.traffics.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  const existing = db.traffics[index];
  const price = updates.price !== undefined ? Number(updates.price) : existing.price;
  const discount = updates.discount !== undefined ? Number(updates.discount) : existing.discount;
  const paidAmount = updates.paidAmount !== undefined ? Number(updates.paidAmount) : existing.paidAmount;
  const dueAmount = Math.max(0, price - discount - paidAmount);

  db.traffics[index] = {
    ...existing,
    ...updates,
    price,
    discount,
    paidAmount,
    dueAmount,
    id: existing.id,
    serialNumber: existing.serialNumber,
    createdTimestamp: existing.createdTimestamp,
  };

  saveDB(db);
  res.json(db.traffics[index]);
});

// Transfer traffic to selected CRO or MK account
app.put('/api/traffic/:id/transfer', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { targetAccountId, targetAccountName, targetRole } = req.body;
  if (!targetAccountName || !targetRole) {
    return res.status(400).json({ error: 'Target account and role are required' });
  }

  const db = loadDB();
  const traffic = db.traffics.find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  traffic.assignedTo = {
    id: targetAccountId || '',
    name: targetAccountName,
    role: targetRole,
  };
  traffic.assignBy = targetAccountName;

  saveDB(db);
  res.json({ success: true, traffic });
});

// Remove traffic (move to Trush bin)
app.put('/api/traffic/:id/remove', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  const traffic = db.traffics.find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  // Soft remove: moved to Trush bin, not permanently destroyed
  traffic.status = 'trash';
  saveDB(db);
  res.json({ success: true, message: 'Moved to Trush bin' });
});

// --- PAYMENT API ---
app.get('/api/payments/requests', authMiddleware, (req, res) => {
  const db = loadDB();
  const pending = (db.paymentRequests || [])
    .filter(pr => pr.status === 'pending')
    .map(pr => {
      const matched = (db.traffics || []).find(
        t => t.id === pr.trafficId || (t.phone && pr.phone && t.phone === pr.phone) || (t.name && pr.trafficName && t.name === pr.trafficName)
      );
      return {
        ...pr,
        images: (matched?.images && matched.images.length > 0) ? matched.images : (pr.images || []),
        gender: matched?.gender || pr.gender || '',
        profession: matched?.profession || '',
      };
    });
  res.json(pending);
});

app.post('/api/payments/requests/:id/accept', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  const reqIndex = db.paymentRequests.findIndex(pr => pr.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Payment request not found' });
  }

  const paymentReq = db.paymentRequests[reqIndex];
  paymentReq.status = 'accepted';

  // Find linked traffic record
  const traffic = db.traffics.find(t => t.id === paymentReq.trafficId) ||
    db.traffics.find(t => (t.phone && paymentReq.phone && t.phone === paymentReq.phone)) ||
    db.traffics.find(t => (t.name && paymentReq.trafficName && t.name === paymentReq.trafficName));

  if (traffic) {
    traffic.paymentStatus = 'accepted';
  }

  // Add to completed Payments table with exact candidate images & gender
  const candidateImages = (traffic?.images && traffic.images.length > 0)
    ? traffic.images
    : (paymentReq.images || []);

  const creatorName = paymentReq.createdBy || paymentReq.assignedBy || traffic?.createdBy || traffic?.assignBy || 'General MK';
  const creatorRole = paymentReq.creatorRole || paymentReq.role || traffic?.creatorRole || 'MK';

  const newPayment = {
    id: `PAY-${String(db.payments.length + 1).padStart(4, '0')}`,
    serialNumber: db.payments.length + 1,
    date: paymentReq.date,
    trafficId: paymentReq.trafficId || (traffic ? traffic.id : ''),
    name: paymentReq.trafficName,
    phone: paymentReq.phone,
    package: paymentReq.package,
    paidAmount: paymentReq.paidAmount,
    dueAmount: paymentReq.dueAmount,
    afterMarriageAmount: paymentReq.afterMarriageFee,
    paymentMethod: paymentReq.paymentMethod,
    assignedRole: paymentReq.role,
    assignedBy: paymentReq.assignedBy,
    createdBy: creatorName,
    createdRole: creatorRole,
    invoiceId: `INV-${paymentReq.trafficId || 'PAY'}-${Date.now().toString().slice(-4)}`,
    images: candidateImages,
    gender: traffic?.gender || paymentReq.gender || '',
    profession: traffic?.profession || '',
  };
  db.payments.push(newPayment);

  saveDB(db);
  res.json({ success: true, payment: newPayment });
});

app.post('/api/payments/requests/:id/reject', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = loadDB();

  const reqIndex = db.paymentRequests.findIndex(pr => pr.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Payment request not found' });
  }

  const paymentReq = db.paymentRequests[reqIndex];
  paymentReq.status = 'rejected';

  // Mark traffic payment status as rejected
  const traffic = db.traffics.find(t => t.id === paymentReq.trafficId);
  if (traffic) {
    traffic.paymentStatus = 'rejected';
  }

  saveDB(db);
  res.json({ success: true });
});

// Get accepted payments enriched with candidate profile photos & details
app.get('/api/payments', authMiddleware, (req, res) => {
  const db = loadDB();
  const enrichedPayments = (db.payments || []).map((p, idx) => {
    const matched = (db.traffics || []).find(
      t => (p.trafficId && t.id === p.trafficId) ||
           (t.phone && p.phone && t.phone === p.phone) ||
           (t.name && p.name && t.name === p.name)
    );
    const creatorName = matched?.createdBy || p.createdBy || 'Sohag';
    const creatorRole = matched?.creatorRole || p.createdRole || 'Super Admin';

    return {
      ...p,
      serialNumber: p.serialNumber || (idx + 1),
      trafficId: p.trafficId || (matched ? matched.id : ''),
      images: (matched?.images && matched.images.length > 0) ? matched.images : (p.images || []),
      gender: matched?.gender || p.gender || '',
      profession: matched?.profession || p.profession || '',
      createdBy: creatorName,
      createdRole: creatorRole,
    };
  });
  res.json(enrichedPayments);
});

// --- PAID TRAFFIC API ---
app.get('/api/paid-traffic', authMiddleware, (req, res) => {
  const db = loadDB();
  // Only traffic records where payment is accepted and status is not trash
  const paid = (db.traffics || [])
    .filter(t => t.status !== 'trash' && t.paymentStatus === 'accepted')
    .map(t => ({
      ...t,
      createdBy: t.createdBy || 'Sohag',
      creatorRole: t.creatorRole || 'Super Admin',
    }));
  res.json(paid);
});

// Change assign for paid traffic
app.put('/api/paid-traffic/:id/change-assign', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { assignedName, role } = req.body;
  if (!assignedName || !role) {
    return res.status(400).json({ error: 'Assigned name and role are required' });
  }

  const db = loadDB();
  const traffic = db.traffics.find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  traffic.assignedTo = {
    id: req.body.assignedId || '',
    name: assignedName,
    role: role,
  };
  traffic.assignBy = assignedName;

  saveDB(db);
  res.json({ success: true, traffic });
});

// Remove from Paid Traffic (moves to Trush bin)
app.put('/api/paid-traffic/:id/remove', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const traffic = db.traffics.find(t => t.id === id);
  if (!traffic) {
    return res.status(404).json({ error: 'Traffic record not found' });
  }

  traffic.status = 'trash';
  saveDB(db);
  res.json({ success: true, message: 'Removed and moved to Trush bin' });
});

// --- START SERVER WITH VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shadikabbo CRM Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
