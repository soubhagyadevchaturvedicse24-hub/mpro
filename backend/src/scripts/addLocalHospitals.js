/**
 * Quick script to add SSIPMT and SSTC hospitals + their user accounts to MongoDB.
 * Run with: node src/scripts/addLocalHospitals.js
 */
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/db.js';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';

(async () => {
  await connectDB();
  console.log('✅ Connected to MongoDB');

  // Find the platform admin to set as creator
  const admin = await User.findOne({ role: 'PLATFORM_ADMIN' });
  if (!admin) {
    console.error('❌ No PLATFORM_ADMIN found. Run seed.js first.');
    process.exit(1);
  }

  const hospitals = [
    {
      code:        'HOS-RGR-SSIPMT',
      name:        'Shri Shankaracharya Institute of Professional Management and Technology',
      shortName:   'SSIPMT',
      email:       'admin@ssipmt.com',
      password:    'ssipmt123pass',
      phone:       '9876000001',
      street:      'Junwani Road',
      city:        'Raipur',
      state:       'Chhattisgarh',
      pincode:     '492015',
      coordinates: [81.6296, 21.2514],   // [lng, lat]
      license:     'LIC-CG-SSIPMT-01',
      reg:         'REG-SSIPMT-01',
    },
    {
      code:        'HOS-RGR-SSTC',
      name:        'Shri Shankaracharya Technical Campus',
      shortName:   'SSTC',
      email:       'admin@sstcrdvm.com',
      password:    'sstc1234pass',
      phone:       '9876000002',
      street:      'Bhilai-Charoda Road',
      city:        'Bhilai',
      state:       'Chhattisgarh',
      pincode:     '490026',
      coordinates: [81.4285, 21.2090],
      license:     'LIC-CG-SSTC-01',
      reg:         'REG-SSTC-01',
    },
  ];

  for (const h of hospitals) {
    // Upsert Hospital
    const existing = await Hospital.findOne({ hospitalCode: h.code });
    if (existing) {
      console.log(`⚠️  Hospital already exists: ${h.name}`);
    } else {
      await Hospital.create({
        hospitalCode:           h.code,
        name:                   h.name,
        licenseNumber:          h.license,
        licenseExpiry:          new Date('2032-01-01'),
        status:                 'ACTIVE',
        region:                 'CENTRAL',
        state:                  h.state,
        geoLocation:            { type: 'Point', coordinates: h.coordinates },
        createdBy:              admin._id,
        contact:                { email: h.email, phone: h.phone },
        address:                { street: h.street, city: h.city, state: h.state, pincode: h.pincode },
        hospitalType:           'PRIVATE',
        legalDetails:           { registrationNumber: h.reg },
        transplantCapabilities: ['KIDNEY'],
      });
      console.log(`✅ Hospital created: ${h.name}`);
    }

    // Upsert User account
    const existingUser = await User.findOne({ email: h.email });
    if (existingUser) {
      console.log(`⚠️  User already exists: ${h.email}`);
    } else {
      await User.create({
        email:       h.email,
        password:    h.password,
        displayName: `${h.shortName} Coordinator`,
        role:        'HOSPITAL_COORDINATOR',
        status:      'ACTIVE',
      });
      console.log(`✅ User created: ${h.email} / ${h.password}`);
    }
  }

  console.log('\n🎉 Done! Credentials summary:');
  console.log('┌────────────┬──────────────────────────┬─────────────────┐');
  console.log('│ Hospital   │ Email                    │ Password        │');
  console.log('├────────────┼──────────────────────────┼─────────────────┤');
  for (const h of hospitals) {
    console.log(`│ ${h.shortName.padEnd(10)} │ ${h.email.padEnd(24)} │ ${h.password.padEnd(15)} │`);
  }
  console.log('└────────────┴──────────────────────────┴─────────────────┘');

  process.exit(0);
})();
