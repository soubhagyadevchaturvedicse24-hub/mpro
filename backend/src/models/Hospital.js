/**
 * Hospital.js — Mongoose model
 * Expanded to store all 9-step registration form data,
 * AES-256-GCM encrypted PII fields, and ECC identity keypair.
 */

import mongoose from 'mongoose';
import { encryptField, decryptField, isEncrypted } from '../utils/crypto.util.js';

// ── Document sub-schema ──────────────────────────────────────────────────────
const documentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true,
      enum: [
        'STATE_HEALTH_REG',
        'THOTA_CERT',
        'NOTTO_ID',
        'NABH_CERT',
        'BLOOD_BANK_LICENSE',
        'MS_ID',
        'COORDINATOR_APPT',
        'APPROVED_ORGANS_CERT',
        'DSC',
        'OTHER',
      ],
    },
    url:        { type: String, required: true },
    uploadedAt: { type: Date,   default: Date.now },
  },
  { _id: false }
);

// ── Main hospital schema ─────────────────────────────────────────────────────
const hospitalSchema = new mongoose.Schema(
  {
    // ── Core identity ────────────────────────────────────────────────────────
    hospitalCode: {
      type: String, required: true, unique: true, uppercase: true, trim: true,
    },
    name: {
      type: String, required: true, trim: true, minlength: 3, maxlength: 200,
    },
    tradeName:         { type: String, trim: true, default: null },
    establishmentYear: { type: Number, min: 1800, max: 2100, default: null },
    hospitalType: {
      type: String, required: true,
      enum: ['GOVERNMENT', 'PRIVATE', 'TRUST', 'CORPORATE', 'AUTONOMOUS'],
    },
    primaryFundingSource: { type: String, default: null },

    // ── Address ──────────────────────────────────────────────────────────────
    address: {
      street:  { type: String, required: true, trim: true },
      city:    { type: String, required: true, trim: true },   // district
      state:   { type: String, required: true, trim: true },
      pincode: {
        type: String, required: true,
        match: [/^\d{6}$/, 'Pincode must be 6 digits'],
      },
      country: { type: String, default: 'India' },
    },

    geoLocation: {
      type:        { type: String, enum: ['Point'] },
      coordinates: { type: [Number] }, // [lng, lat] — omit entire field if not provided
    },

    // ── Contact ──────────────────────────────────────────────────────────────
    contact: {
      phone:   {
        type: String, required: true,
        match: [/^\d{10}$/, 'Phone must be 10 digits'],
      },
      email:   {
        type: String, required: true, lowercase: true, trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },
      landline: { type: String, default: null },
      website:  { type: String, default: null },
    },

    // ── Legal & Financial Identifiers (PII — stored AES-256-GCM encrypted) ──
    legalDetails: {
      registrationNumber: { type: String, required: true, unique: true, trim: true },
      licenseNumber:      { type: String, trim: true, default: null },
      gstin:              { type: String, default: null }, // encrypted
      pan:                { type: String, default: null }, // encrypted
      cin:                { type: String, default: null },
      pmjayId:            { type: String, default: null },
      abdmHfrId:          { type: String, default: null },
    },

    // ── NABH Accreditation ───────────────────────────────────────────────────
    accreditation: {
      isNabh:        { type: Boolean, default: false },
      nabhNumber:    { type: String,  default: null },
      nabhValidUntil:{ type: Date,    default: null },
    },

    // ── THOTA / Transplant Authorization ─────────────────────────────────────
    thota: {
      isRegistered:     { type: Boolean, default: false },
      regNumber:        { type: String,  default: null },
      issuingAuthority: { type: String,  default: null },
      validUntil:       { type: Date,    default: null },
      authTypes:        { type: [String], default: [] },
      approvedOrgans: {
        type: [String],
        enum: ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS', 'INTESTINE'],
        default: [],
      },
      nottoId: { type: String, default: null },
      sottoId: { type: String, default: null },
      rottoId: { type: String, default: null },
    },

    // ── Backward-compat alias used by matching engine ────────────────────────
    transplantCapabilities: {
      type: [String],
      enum: ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS', 'INTESTINE'],
      default: [],
    },

    // ── Key Personnel (contact fields encrypted) ─────────────────────────────
    keyPersonnel: {
      headName:           { type: String, default: null },
      headRegNo:          { type: String, default: null },
      headEmail:          { type: String, default: null }, // encrypted
      headMobile:         { type: String, default: null }, // encrypted
      coordName:          { type: String, default: null },
      coordQualification: { type: String, default: null },
      coordEmail:         { type: String, default: null }, // encrypted
      coordMobile:        { type: String, default: null }, // encrypted
    },

    // ── Infrastructure ───────────────────────────────────────────────────────
    infrastructure: {
      icuBeds:           { type: Number, default: null },
      ventilators:       { type: Number, default: null },
      bloodBankType:     { type: String, default: null },
      bloodBankLicense:  { type: String, default: null },
      operatingTheatres: { type: Number, default: null },
    },

    // ── Documents ────────────────────────────────────────────────────────────
    documents: { type: [documentSchema], default: [] },

    // ── ECC P-256 Digital Identity (generated on approval) ───────────────────
    identity: {
      publicKeyPem:           { type: String, default: null }, // public — readable
      encryptedPrivateKeyPem: { type: String, default: null }, // AES-256-GCM encrypted
      keyGeneratedAt:         { type: Date,   default: null },
      keyAlgorithm:           { type: String, default: 'EC-P256' },
      privateKeyDownloadedAt: { type: Date,   default: null }, // audit trail
    },

    // ── Workflow status ───────────────────────────────────────────────────────
    status: {
      type: String, required: true,
      enum: [
        'DRAFT',
        'PENDING_VERIFICATION',
        'UNDER_REVIEW',
        'APPROVED',
        'ACTIVE',
        'SUSPENDED',
        'REJECTED',
        'DEACTIVATED',
      ],
      default: 'DRAFT',
    },

    rejectionReason: { type: String, default: null },

    // ── Audit refs ────────────────────────────────────────────────────────────
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// ── Geo index ────────────────────────────────────────────────────────────────
hospitalSchema.index({ geoLocation: '2dsphere' });

// ── AES-256-GCM encryption hooks ─────────────────────────────────────────────
// Fields that must be encrypted before persisting:
const PII_PATHS = [
  'legalDetails.gstin',
  'legalDetails.pan',
  'keyPersonnel.headEmail',
  'keyPersonnel.headMobile',
  'keyPersonnel.coordEmail',
  'keyPersonnel.coordMobile',
];

/**
 * Reads a dot-notation path from an object.
 */
const getPath = (obj, path) => {
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
};

/**
 * Sets a dot-notation path on an object.
 */
const setPath = (obj, path, value) => {
  const keys = path.split('.');
  keys.slice(0, -1).reduce((acc, k) => (acc[k] = acc[k] || {}), obj)[keys[keys.length - 1]] = value;
};

hospitalSchema.pre('save', function () {
  for (const fieldPath of PII_PATHS) {
    const raw = getPath(this, fieldPath);
    if (raw && typeof raw === 'string' && !isEncrypted(raw)) {
      setPath(this, fieldPath, encryptField(raw));
    }
  }
});

/**
 * Virtual to get decrypted PII for internal service use.
 * Call hospital.decryptedPII() to get the plaintext values.
 */
hospitalSchema.methods.decryptedPII = function () {
  const out = {};
  for (const fieldPath of PII_PATHS) {
    const enc = getPath(this, fieldPath);
    out[fieldPath] = enc ? decryptField(enc) : null;
  }
  return out;
};

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
