/**
 * ensure_seed.mjs — Idempotent seed: ensures all required DB entities exist.
 * Run from: d:\Development\Projects\Organ-Transport-System\backend
 * Command:  node ensure_seed.mjs
 */
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '.local-db');
console.log('\n🗄️  Connecting to local-db at:', dbPath);

// Try Atlas first, fallback to local
let connected = false;
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
  console.log('✅ Connected to MongoDB Atlas');
  connected = true;
} catch (e) {
  console.log('⚠️  Atlas unreachable — using local WiredTiger DB');
}

let mongoServer;
if (!connected) {
  mongoServer = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger' }
  });
  await mongoose.connect(mongoServer.getUri());
  console.log('✅ Connected to local WiredTiger DB');
}

const { default: User }          = await import('./src/models/User.js');
const { default: Hospital }      = await import('./src/models/Hospital.js');
const { default: TransportBox }  = await import('./src/models/TransportBox.js');
const { hashDeviceSecret }       = await import('./src/transport/services/box.service.js');

// ── Users ──────────────────────────────────────────────────────────────
const USERS = [
  { email: 'admin@platform.com',              password: 'admin123admin',      displayName: 'System Executive',         role: 'PLATFORM_ADMIN' },
  { email: 'notto@gov.in',                    password: 'notto123notto',      displayName: 'NOTTO Nodal Officer',      role: 'NOTTO_OFFICER' },
  { email: 'courier@transport.com',           password: 'courier123courier',  displayName: 'Courier 7-Alpha',          role: 'COURIER' },
  { email: 'contact@aiims.edu',               password: 'aiims123aiims',      displayName: 'Dr. Sarah Jenkins',        role: 'HOSPITAL_COORDINATOR' },
  { email: 'info@tmc.gov.in',                 password: 'tmc123tmc',          displayName: 'Dr. R. Desai',             role: 'HOSPITAL_COORDINATOR' },
  { email: 'contact@sstc.ac.in',              password: 'sstc123sstc',        displayName: 'Dr. P. Kumar',             role: 'HOSPITAL_COORDINATOR' },
  { email: 'info@ssipmt.com',                 password: 'ssipmt123ssipmt',    displayName: 'Dr. A. Sharma',            role: 'HOSPITAL_COORDINATOR' },
  { email: 'transplant@fortishealth.com',     password: 'fortis123fortis',    displayName: 'Dr. S. Mehta',             role: 'HOSPITAL_COORDINATOR' },
  { email: 'transplant@apollohospitals.com',  password: 'apollo123apollo',    displayName: 'Dr. R. Nair',              role: 'HOSPITAL_COORDINATOR' },
  { email: 'organ.transplant@maxhealthcare.com', password: 'max123max',       displayName: 'Dr. V. Gupta',             role: 'HOSPITAL_COORDINATOR' },
];

console.log('\n── Ensuring Users ─────────────────────────────────────────');
let adminId;
for (const u of USERS) {
  const existing = await User.findOne({ email: u.email });
  if (existing) {
    // If locked from previous test runs — reset it
    if (existing.status === 'LOCKED' || existing.failedLoginAttempts > 0) {
      existing.status = 'ACTIVE';
      existing.failedLoginAttempts = 0;
      existing.lockUntil = null;
      await existing.save();
      console.log(`  🔓 UNLOCKED ${u.email}`);
    } else {
      console.log(`  ✅ EXISTS   ${u.email} [${existing.role}]`);
    }
    if (u.role === 'PLATFORM_ADMIN') adminId = existing._id;
  } else {
    const created = await User.create({ ...u, status: 'ACTIVE', failedLoginAttempts: 0 });
    console.log(`  ➕ CREATED  ${u.email} [${u.role}]`);
    if (u.role === 'PLATFORM_ADMIN') adminId = created._id;
  }
}

// ── Hospitals ──────────────────────────────────────────────────────────
const HOSPITALS = [
  {
    hospitalCode: 'HOS-DEL-0001', name: 'AIIMS New Delhi',
    contact: { email: 'contact@aiims.edu', phone: '9876543210' },
    address: { street: 'Ansari Nagar', city: 'New Delhi', state: 'Delhi', pincode: '110029' },
    geoLocation: { type: 'Point', coordinates: [77.2090, 28.5659] },
    hospitalType: 'GOVERNMENT', region: 'NORTH', state: 'Delhi',
    legalDetails: { registrationNumber: 'REG-AIIMS-01', licenseNumber: 'LIC-AIIMS-01' },
    transplantCapabilities: ['KIDNEY', 'LIVER'], status: 'ACTIVE',
  },
  {
    hospitalCode: 'HOS-TMC-0002', name: 'Tata Memorial Centre Mumbai',
    contact: { email: 'info@tmc.gov.in', phone: '9870000001' },
    address: { street: 'Dr. E. Borges Marg', city: 'Mumbai', state: 'Maharashtra', pincode: '400012' },
    geoLocation: { type: 'Point', coordinates: [72.8370, 18.9988] },
    hospitalType: 'AUTONOMOUS', region: 'WEST', state: 'Maharashtra',
    legalDetails: { registrationNumber: 'REG-TMC-02', licenseNumber: 'LIC-TMC-02' },
    transplantCapabilities: ['LIVER', 'KIDNEY'], status: 'ACTIVE',
  },
  {
    hospitalCode: 'HOS-SSTC-0003', name: 'SSTC Medical College Bhilai',
    contact: { email: 'contact@sstc.ac.in', phone: '9870000002' },
    address: { street: 'NH-6 Bhilai', city: 'Bhilai', state: 'Chhattisgarh', pincode: '490020' },
    geoLocation: { type: 'Point', coordinates: [81.4280, 21.1900] },
    hospitalType: 'PRIVATE', region: 'CENTRAL', state: 'Chhattisgarh',
    legalDetails: { registrationNumber: 'REG-SSTC-01', licenseNumber: 'LIC-SSTC-01' },
    transplantCapabilities: ['KIDNEY'], status: 'ACTIVE',
  },
  {
    hospitalCode: 'HOS-SSIPMT-0004', name: 'Shri Shankaracharya Medical College',
    contact: { email: 'info@ssipmt.com', phone: '9870000003' },
    address: { street: 'Junwani Road', city: 'Bhilai', state: 'Chhattisgarh', pincode: '490020' },
    geoLocation: { type: 'Point', coordinates: [81.4350, 21.2100] },
    hospitalType: 'PRIVATE', region: 'CENTRAL', state: 'Chhattisgarh',
    legalDetails: { registrationNumber: 'REG-SSIPMT-01', licenseNumber: 'LIC-SSIPMT-01' },
    transplantCapabilities: ['KIDNEY', 'CORNEA'], status: 'ACTIVE',
  },
  {
    hospitalCode: 'HOS-FORTIS-0005', name: 'Fortis Hospital Noida',
    contact: { email: 'transplant@fortishealth.com', phone: '9870000004' },
    address: { street: 'Sector 62', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' },
    geoLocation: { type: 'Point', coordinates: [77.3769, 28.6271] },
    hospitalType: 'CORPORATE', region: 'NORTH', state: 'Uttar Pradesh',
    legalDetails: { registrationNumber: 'REG-FORTIS-01', licenseNumber: 'LIC-FORTIS-01' },
    transplantCapabilities: ['KIDNEY', 'LIVER', 'HEART'], status: 'ACTIVE',
  },
  {
    hospitalCode: 'HOS-APOLLO-0006', name: 'Apollo Hospitals Chennai',
    contact: { email: 'transplant@apollohospitals.com', phone: '9870000005' },
    address: { street: 'Greams Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600006' },
    geoLocation: { type: 'Point', coordinates: [80.2518, 13.0569] },
    hospitalType: 'PRIVATE', region: 'SOUTH', state: 'Tamil Nadu',
    legalDetails: { registrationNumber: 'REG-APOLLO-01', licenseNumber: 'LIC-APOLLO-01' },
    transplantCapabilities: ['KIDNEY', 'LIVER', 'HEART', 'LUNG'], status: 'ACTIVE',
  },
  {
    hospitalCode: 'HOS-MAX-0007', name: 'Max Super Speciality Hospital Delhi',
    contact: { email: 'organ.transplant@maxhealthcare.com', phone: '9870000006' },
    address: { street: 'Press Enclave Road', city: 'New Delhi', state: 'Delhi', pincode: '110017' },
    geoLocation: { type: 'Point', coordinates: [77.2167, 28.5245] },
    hospitalType: 'CORPORATE', region: 'NORTH', state: 'Delhi',
    legalDetails: { registrationNumber: 'REG-MAX-01', licenseNumber: 'LIC-MAX-01' },
    transplantCapabilities: ['KIDNEY', 'LIVER'], status: 'ACTIVE',
  },
];

console.log('\n── Ensuring Hospitals ─────────────────────────────────────');
for (const h of HOSPITALS) {
  const existing = await Hospital.findOne({ hospitalCode: h.hospitalCode });
  if (existing) {
    console.log(`  ✅ EXISTS   ${h.name}`);
  } else {
    await Hospital.create({ ...h, createdBy: adminId });
    console.log(`  ➕ CREATED  ${h.name}`);
  }
}

// ── Transport Box ──────────────────────────────────────────────────────
console.log('\n── Ensuring Transport Box ─────────────────────────────────');
const existingBox = await TransportBox.findOne({ boxId: 'BOX-2026-FABRIC-ALPHA' });
if (existingBox) {
  console.log('  ✅ EXISTS   BOX-2026-FABRIC-ALPHA');
} else {
  await TransportBox.create({
    boxId: 'BOX-2026-FABRIC-ALPHA',
    deviceId: 'BOX-2026-FABRIC-ALPHA',
    deviceSecretHash: hashDeviceSecret('secret123'),
    status: 'AVAILABLE',
    batteryHealth: 100,
    lastKnownLocation: { type: 'Point', coordinates: [77.2090, 28.5659] },
  });
  console.log('  ➕ CREATED  BOX-2026-FABRIC-ALPHA');
}

// ── Summary ────────────────────────────────────────────────────────────
const userCount = await User.countDocuments();
const hospCount = await Hospital.countDocuments();
const boxCount  = await TransportBox.countDocuments();
console.log('\n── DB Summary ──────────────────────────────────────────────');
console.log(`  Users: ${userCount}  |  Hospitals: ${hospCount}  |  Boxes: ${boxCount}`);
console.log('\n✅ ensure_seed complete!\n');

await mongoose.disconnect();
if (mongoServer) await mongoServer.stop();
process.exit(0);
