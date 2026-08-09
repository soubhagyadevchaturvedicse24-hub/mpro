import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  roleInBoard: { 
    type: String, 
    required: true 
  },
  signedAt: { 
    type: Date, 
    default: Date.now 
  },
  signatureDocumentUrl: { 
    type: String 
  }
}, { _id: false });

const brainDeathCertificationSchema = new mongoose.Schema({
  donorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donor', 
    required: true 
  },
  hospitalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hospital', 
    required: true 
  },
  overallStatus: {
    type: String,
    enum: ['NOT_STARTED', 'ROUND_1_IN_PROGRESS', 'ROUND_1_COMPLETED', 'ROUND_2_IN_PROGRESS', 'COMPLETED'],
    default: 'NOT_STARTED'
  },
  round1: {
    status: { 
      type: String, 
      enum: ['IN_PROGRESS', 'COMPLETED'], 
      default: 'IN_PROGRESS' 
    },
    signatures: { 
      type: [signatureSchema],
      validate: [arr => arr.length <= 4, 'Round can have max 4 signatures'] 
    },
    completedAt: { 
      type: Date 
    }
  },
  round2: {
    status: { 
      type: String, 
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], 
      default: 'PENDING' 
    },
    signatures: { 
      type: [signatureSchema],
      validate: [arr => arr.length <= 4, 'Round can have max 4 signatures'] 
    },
    completedAt: { 
      type: Date 
    }
  }
}, { timestamps: true });

brainDeathCertificationSchema.index({ donorId: 1 }, { unique: true });
brainDeathCertificationSchema.index({ hospitalId: 1, 'round1.status': 1, 'round2.status': 1 });

const BrainDeathCertification = mongoose.model('BrainDeathCertification', brainDeathCertificationSchema);
export default BrainDeathCertification;
