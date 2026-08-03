/**
 * upload.middleware.js
 * Multer configuration for hospital document uploads.
 *
 * Accepts up to 9 document files (one per type), each max 5 MB.
 * Allowed MIME types: PDF, JPEG, PNG.
 *
 * Files are stored in memory (Buffer) and processed by the controller
 * before being written to disk or a cloud provider.
 *
 * Document field names match the frontend formData keys exactly:
 *   docStateHealth   — State Health Authority Hospital Registration
 *   docThotaCert     — THOTA Authorization Certificate
 *   docNottoId       — NOTTO ID Proof
 *   docNabhCert      — NABH Accreditation Certificate
 *   docBloodBank     — Blood Bank License
 *   docMsId          — Medical Superintendent Photo ID
 *   docCoordAppt     — Transplant Coordinator Appointment Letter
 *   docApprovedOrgans — Approved Organ Types Certificate
 *   docDsc           — Digital Signature Certificate
 */

import multer from 'multer';
import path   from 'path';
import fs     from 'fs';
import { fileURLToPath } from 'url';

// ── Upload directory (local fallback; swap for cloud in production) ──────────
const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', '..', '..', 'uploads', 'hospitals');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_EXT  = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

// ── Multer disk storage (saves to uploads/hospitals/<hospitalCode>/) ──────────
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // hospitalCode is set by the controller before multer processes files
    // Fall back to 'tmp' while hospital code is not yet known
    const folder = path.join(UPLOADS_ROOT, req.body?.hospitalCodeSlug || 'tmp');
    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const safeName = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

// ── File type filter ──────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Invalid file type. Only PDF, JPEG, and PNG are accepted.'), {
        code:   'INVALID_FILE_TYPE',
        status: 400,
      }),
      false
    );
  }
};

// ── Multer instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage:   diskStorage,
  limits: {
    fileSize:  5 * 1024 * 1024, // 5 MB per file
    files:     9,               // max 9 files total
  },
  fileFilter,
});

/**
 * Middleware: accepts all 9 hospital document fields.
 * Each field is optional and accepts at most 1 file.
 * Attach to the registration route before the controller.
 */
export const uploadHospitalDocs = upload.fields([
  { name: 'docStateHealth',    maxCount: 1 },
  { name: 'docThotaCert',      maxCount: 1 },
  { name: 'docNottoId',        maxCount: 1 },
  { name: 'docNabhCert',       maxCount: 1 },
  { name: 'docBloodBank',      maxCount: 1 },
  { name: 'docMsId',           maxCount: 1 },
  { name: 'docCoordAppt',      maxCount: 1 },
  { name: 'docApprovedOrgans', maxCount: 1 },
  { name: 'docDsc',            maxCount: 1 },
]);

/**
 * Maps uploaded files (req.files) into the Hospital document array format.
 *
 * @param {object} files — req.files from multer (fieldname → [File])
 * @param {string} baseUrl — e.g. "http://localhost:5000"
 * @returns {Array<{ documentType, url, uploadedAt }>}
 */
export const mapUploadedFiles = (files = {}, baseUrl = '') => {
  const FIELD_TO_TYPE = {
    docStateHealth:    'STATE_HEALTH_REG',
    docThotaCert:      'THOTA_CERT',
    docNottoId:        'NOTTO_ID',
    docNabhCert:       'NABH_CERT',
    docBloodBank:      'BLOOD_BANK_LICENSE',
    docMsId:           'MS_ID',
    docCoordAppt:      'COORDINATOR_APPT',
    docApprovedOrgans: 'APPROVED_ORGANS_CERT',
    docDsc:            'DSC',
  };

  const docs = [];
  for (const [fieldname, fileArr] of Object.entries(files)) {
    if (!fileArr || !fileArr[0]) continue;
    const file = fileArr[0];
    docs.push({
      documentType: FIELD_TO_TYPE[fieldname] || 'OTHER',
      url:          `${baseUrl}/uploads/hospitals/${path.basename(path.dirname(file.path))}/${file.filename}`,
      uploadedAt:   new Date(),
    });
  }
  return docs;
};
