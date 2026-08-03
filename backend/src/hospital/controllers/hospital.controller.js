/**
 * hospital.controller.js
 * HTTP request handlers for the Hospital domain.
 * All business logic lives in hospital.service.js.
 */

import * as hospitalService from '../services/hospital.service.js';
import { mapUploadedFiles } from '../../middleware/upload.middleware.js';
import {
  publicRegisterSchema,
  createHospitalSchema,
  updateHospitalSchema,
  rejectHospitalSchema,
  listHospitalsSchema,
} from '../validators/hospital.validator.js';

const handleValidation = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw {
      code:    'VALIDATION_001',
      message: 'Validation failed',
      status:  400,
      details: result.error.issues,
    };
  }
  return result.data;
};

// ── Public Registration ───────────────────────────────────────────────────────

/**
 * POST /api/hospitals/register  (no auth required)
 *
 * Accepts multipart/form-data with:
 *   - hospitalData: JSON string of the full form payload
 *   - Up to 9 document files (docStateHealth, docThotaCert, …)
 *
 * Returns: { hospitalCode } for tracking
 */
export const publicRegisterHospital = async (req, res, next) => {
  try {
    let rawData;

    // Support two content types:
    // 1. multipart/form-data (with file uploads) → hospitalData is a JSON string field
    // 2. application/json (API testing, no files)  → req.body is the payload directly
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      // Multipart: hospitalData field holds the JSON payload
      try {
        rawData = JSON.parse(req.body?.hospitalData || '{}');
      } catch {
        return res.status(400).json({
          success: false,
          message: 'hospitalData must be valid JSON string when sending multipart/form-data.',
        });
      }
    } else {
      // JSON body: req.body IS the payload
      rawData = req.body;
    }

    const data = handleValidation(publicRegisterSchema, rawData);

    // Map uploaded files to document array (empty when JSON-only request)
    const baseUrl   = `${req.protocol}://${req.get('host')}`;
    const documents = mapUploadedFiles(req.files || {}, baseUrl);

    const { hospital, hospitalCode } = await hospitalService.publicRegisterHospital(
      data,
      documents
    );

    return res.status(201).json({
      success: true,
      message: 'Hospital registration submitted successfully. Awaiting admin approval.',
      data: {
        hospitalCode,
        status:      hospital.status,
        submittedAt: hospital.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Public Status Check ────────────────────────────────────────────────────────

/**
 * GET /api/hospitals/status/:hospitalCode  (no auth required)
 * Allows applicants to track their application by hospital code.
 */
export const getHospitalStatus = async (req, res, next) => {
  try {
    const hospital = await hospitalService.getHospitalByCode(req.params.hospitalCode);
    return res.status(200).json({
      success: true,
      message: 'Application status retrieved',
      data: {
        hospitalCode:   hospital.hospitalCode,
        name:           hospital.name,
        status:         hospital.status,
        submittedAt:    hospital.createdAt,
        approvedAt:     hospital.approvedAt  || null,
        rejectionReason:hospital.rejectionReason || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const createHospital = async (req, res, next) => {
  try {
    const data     = handleValidation(createHospitalSchema, req.body);
    const hospital = await hospitalService.createHospital(data, req.user.sub);
    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data:    { hospital },
    });
  } catch (err) { next(err); }
};

export const listHospitals = async (req, res, next) => {
  try {
    const query  = handleValidation(listHospitalsSchema, req.query);
    const result = await hospitalService.listHospitals(query);
    res.status(200).json({
      success: true,
      message: 'Hospitals retrieved',
      data:    result,
    });
  } catch (err) { next(err); }
};

export const getHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.getHospital(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Hospital retrieved',
      data:    { hospital },
    });
  } catch (err) { next(err); }
};

export const updateHospital = async (req, res, next) => {
  try {
    const data     = handleValidation(updateHospitalSchema, req.body);
    const hospital = await hospitalService.updateHospital(req.params.id, data);
    res.status(200).json({
      success: true,
      message: 'Hospital updated',
      data:    { hospital },
    });
  } catch (err) { next(err); }
};

// ── Workflow Actions ──────────────────────────────────────────────────────────

export const submitHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.submitHospital(req.params.id, req.user.sub);
    res.status(200).json({
      success: true,
      message: 'Hospital submitted for verification',
      data:    { hospital },
    });
  } catch (err) { next(err); }
};

export const approveHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.approveHospital(req.params.id, req.user.sub);

    // Build response — include raw private key one-time if just generated
    const responseData = {
      hospital: {
        _id:          hospital._id,
        hospitalCode: hospital.hospitalCode,
        name:         hospital.name,
        status:       hospital.status,
        approvedAt:   hospital.approvedAt,
        identity: {
          publicKeyPem:   hospital.identity?.publicKeyPem,
          keyGeneratedAt: hospital.identity?.keyGeneratedAt,
          keyAlgorithm:   hospital.identity?.keyAlgorithm,
        },
      },
    };

    // One-time: include raw private key in response (never stored raw in DB)
    if (hospital._rawPrivateKeyPem) {
      responseData.privateKeyPem = hospital._rawPrivateKeyPem;
      responseData.privateKeyWarning =
        'This private key is shown ONCE. Store it securely — it cannot be retrieved again.';
    }

    res.status(200).json({
      success: true,
      message: 'Hospital approved. Login credentials activated. ECC identity certificate generated.',
      data:    responseData,
    });
  } catch (err) { next(err); }
};

export const rejectHospital = async (req, res, next) => {
  try {
    const { rejectionReason } = handleValidation(rejectHospitalSchema, req.body);
    const hospital = await hospitalService.rejectHospital(
      req.params.id, req.user.sub, rejectionReason
    );
    res.status(200).json({
      success: true,
      message: 'Hospital rejected. Applicant account disabled.',
      data:    { hospital },
    });
  } catch (err) { next(err); }
};

export const reviewHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.reviewHospital(req.params.id, req.user.sub);
    res.status(200).json({
      success: true,
      message: 'Hospital marked as Under Review',
      data:    { hospital },
    });
  } catch (err) { next(err); }
};

export const activateHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.activateHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital activated', data: { hospital } });
  } catch (err) { next(err); }
};

export const suspendHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.suspendHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital suspended', data: { hospital } });
  } catch (err) { next(err); }
};

export const reactivateHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.reactivateHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital reactivated', data: { hospital } });
  } catch (err) { next(err); }
};

export const deactivateHospital = async (req, res, next) => {
  try {
    const result = await hospitalService.deactivateHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital deactivated', data: result });
  } catch (err) { next(err); }
};

export const downloadKey = async (req, res, next) => {
  try {
    const { decryptPrivateKey } = await import('../../utils/eccKeyPair.util.js');
    const Hospital = (await import('../../models/Hospital.js')).default;
    
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    
    // Ensure the user downloading the key is the one who created the hospital, or an admin
    if (hospital.createdBy.toString() !== req.user.sub && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!hospital.identity || !hospital.identity.encryptedPrivateKeyPem) {
      return res.status(404).json({ success: false, message: 'Private key not generated yet' });
    }

    const rawPrivateKey = decryptPrivateKey(hospital.identity.encryptedPrivateKeyPem);

    res.setHeader('Content-Disposition', `attachment; filename="${hospital.hospitalCode}-private-key.pem"`);
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.status(200).send(rawPrivateKey);
  } catch (err) { next(err); }
};
