/**
 * hospital.validator.js
 * Zod schemas for all hospital API endpoints.
 * All sub-documents use .optional() so forms can be saved as DRAFT progressively.
 */

import { z } from 'zod';

// ── Reusable sub-schemas ─────────────────────────────────────────────────────

const addressSchema = z.object({
  street:  z.string().min(1, 'Street address is required'),
  city:    z.string().min(1, 'City / district is required'),
  state:   z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  country: z.string().optional().default('India'),
});

const contactSchema = z.object({
  phone:    z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  email:    z.string().email('Invalid email format'),
  landline: z.string().optional().nullable(),
  website:  z.string().url().optional().nullable(),
});

const legalDetailsSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  licenseNumber:      z.string().optional().nullable(),
  gstin:  z.string().optional().nullable(),
  pan:    z.string().optional().nullable(),
  cin:    z.string().optional().nullable(),
  pmjayId:    z.string().optional().nullable(),
  abdmHfrId:  z.string().optional().nullable(),
}).optional();

const accreditationSchema = z.object({
  isNabh:         z.boolean().optional().default(false),
  nabhNumber:     z.string().optional().nullable(),
  nabhValidUntil: z.string().optional().nullable(), // ISO date string from form
}).optional();

const thotaSchema = z.object({
  isRegistered:     z.boolean().optional().default(false),
  regNumber:        z.string().optional().nullable(),
  issuingAuthority: z.string().optional().nullable(),
  validUntil:       z.string().optional().nullable(),
  authTypes:        z.array(z.string()).optional().default([]),
  approvedOrgans:   z.array(z.enum([
    'KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS', 'INTESTINE',
  ])).optional().default([]),
  nottoId: z.string().optional().nullable(),
  sottoId: z.string().optional().nullable(),
  rottoId: z.string().optional().nullable(),
}).optional();

const keyPersonnelSchema = z.object({
  headName:           z.string().optional().nullable(),
  headRegNo:          z.string().optional().nullable(),
  headEmail:          z.string().email().optional().nullable(),
  headMobile:         z.string().optional().nullable(),
  coordName:          z.string().optional().nullable(),
  coordQualification: z.string().optional().nullable(),
  coordEmail:         z.string().email().optional().nullable(),
  coordMobile:        z.string().optional().nullable(),
}).optional();

const infrastructureSchema = z.object({
  icuBeds:           z.number().int().min(0).optional().nullable(),
  ventilators:       z.number().int().min(0).optional().nullable(),
  bloodBankType:     z.string().optional().nullable(),
  bloodBankLicense:  z.string().optional().nullable(),
  operatingTheatres: z.number().int().min(0).optional().nullable(),
}).optional();

// ── Public registration schema ───────────────────────────────────────────────
// Includes account credentials (email + password for User creation).
export const publicRegisterSchema = z.object({
  // Core (required)
  name:         z.string().min(3, 'Hospital name must be at least 3 characters').max(200),
  hospitalType: z.enum(['GOVERNMENT', 'PRIVATE', 'TRUST', 'CORPORATE', 'AUTONOMOUS']),
  address:      addressSchema,
  contact:      contactSchema,

  // Account credentials (required for User creation)
  loginEmail:   z.string().email('Login email must be a valid email address'),
  password:     z.string().min(12, 'Password must be at least 12 characters'),
  displayName:  z.string().min(1, 'Display name is required'),

  // Optional extras
  tradeName:            z.string().optional().nullable(),
  establishmentYear:    z.number().int().min(1800).max(2100).optional().nullable(),
  primaryFundingSource: z.string().optional().nullable(),
  legalDetails:         legalDetailsSchema,
  accreditation:        accreditationSchema,
  thota:                thotaSchema,
  keyPersonnel:         keyPersonnelSchema,
  infrastructure:       infrastructureSchema,
  transplantCapabilities: z.array(z.enum([
    'KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS', 'INTESTINE',
  ])).optional().default([]),
});

// ── Admin CRUD schema (authenticated, same structure minus credentials) ───────
export const createHospitalSchema = z.object({
  name:         z.string().min(3).max(200),
  hospitalType: z.enum(['GOVERNMENT', 'PRIVATE', 'TRUST', 'CORPORATE', 'AUTONOMOUS']),
  address:      addressSchema,
  contact:      contactSchema,
  legalDetails: legalDetailsSchema,

  tradeName:            z.string().optional().nullable(),
  establishmentYear:    z.number().int().min(1800).max(2100).optional().nullable(),
  primaryFundingSource: z.string().optional().nullable(),
  accreditation:        accreditationSchema,
  thota:                thotaSchema,
  keyPersonnel:         keyPersonnelSchema,
  infrastructure:       infrastructureSchema,
  transplantCapabilities: z.array(z.enum([
    'KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS', 'INTESTINE',
  ])).optional().default([]),

  // Geo (optional)
  geoLocation: z.object({
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]).optional(),
  }).optional(),
});

export const updateHospitalSchema = createHospitalSchema.partial();

export const rejectHospitalSchema = z.object({
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

export const listHospitalsSchema = z.object({
  status: z.enum([
    'DRAFT', 'PENDING_VERIFICATION', 'UNDER_REVIEW',
    'APPROVED', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'DEACTIVATED',
  ]).optional(),
  page:   z.coerce.number().int().min(1).optional().default(1),
  limit:  z.coerce.number().int().min(1).max(100).optional().default(20),
});
