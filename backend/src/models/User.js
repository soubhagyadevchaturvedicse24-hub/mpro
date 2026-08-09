import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        'PLATFORM_ADMIN',
        'NOTTO_OFFICER',
        'ROTTO_SOTTO_OFFICER',
        'HOSPITAL_COORDINATOR',
        'TRANSPLANT_SURGEON',
        'TRANSPORT_COORDINATOR',
        'COURIER',
        'AUDITOR',
        'APPROPRIATE_AUTHORITY',
        'AUTHORIZATION_COMMITTEE_MEMBER',
        'ICU_NODAL_OFFICER',
      ],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'LOCKED', 'DISABLED', 'DELETED'],
      default: 'PENDING_APPROVAL',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      index: true, // Fast lookup during token refresh
    },
    totpSecret: {
      type: String,
      default: null,
    },
    isTotpEnabled: {
      type: Boolean,
      default: false,
    },
    scopes: {
      type: [{ type: String }],
      default: []
    },
    // ── Hospital Association (for HOSPITAL_* roles) ──────────────────────────
    // Populated at user-creation time by the hospital approval workflow.
    // NULL for Nodal Officers (NOTTO / ROTTO / SOTTO) who have global scope.
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
      index: true,
    },
    hospitalName: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
