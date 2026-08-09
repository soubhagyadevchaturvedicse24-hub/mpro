import mongoose from 'mongoose';

const authorizationApprovalSchema = new mongoose.Schema({
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
  committeeType: { 
    type: String, 
    enum: ['HOSPITAL_AC', 'STATE_AC'], 
    required: true 
  },
  hearingDate: { 
    type: Date, 
    required: true 
  },
  decision: { 
    type: String, 
    enum: ['APPROVED', 'REJECTED'], 
    required: true 
  },
  remarks: { 
    type: String 
  },
  orderDocumentUrl: { 
    type: String 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

// Indexes for uniqueness and fast queries
authorizationApprovalSchema.index({ donorId: 1 }, { unique: true });
authorizationApprovalSchema.index({ hospitalId: 1, decision: 1 });
authorizationApprovalSchema.index({ committeeType: 1, hearingDate: -1 });

const AuthorizationApproval = mongoose.model('AuthorizationApproval', authorizationApprovalSchema);
export default AuthorizationApproval;
