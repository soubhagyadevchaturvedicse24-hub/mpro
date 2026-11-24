import mongoose from 'mongoose';

const chainOfCustodyEventSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
  },
  { _id: false }
);

const transportMissionSchema = new mongoose.Schema(
  {
    missionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    organId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organ',
      required: false,
      default: null,
    },
    organType: {
      type: String,
      default: 'Kidney',
    },
    transportType: {
      type: String,
      default: 'Organ Transport',
    },
    patientName: {
      type: String,
      default: null,
    },
    patientId: {
      type: String,
      default: null,
    },
    priority: {
      type: String,
      default: 'High',
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: false,
      default: null,
    },
    boxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportBox',
      required: true,
    },
    assignedRfidCard: {
      type: Number,
      enum: [1, 2, 3],
      default: null, // 1, 2, or 3 — physical RFID card slot assigned by NOTTO/ROTO/SOTTO
    },
    courierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    originHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    destinationHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    estimatedArrivalTime: {
      type: Date,
    },
    actualDepartureTime: {
      type: Date,
    },
    actualArrivalTime: {
      type: Date,
    },
    chainOfCustody: {
      type: [chainOfCustodyEventSchema],
      default: [],
    },
    health: {
      status: {
        type: String,
        enum: ['NORMAL', 'WARNING', 'CRITICAL'],
        default: 'NORMAL',
      },
      score: {
        type: Number,
        default: 100,
      },
      lastEvaluation: {
        type: Date,
      },
      reasons: {
        type: [String],
        default: [],
      }
    },
  },
  {
    timestamps: true,
  }
);

transportMissionSchema.index({ status: 1 });
transportMissionSchema.index({ originHospital: 1, status: 1 });          // Origin hospital's missions
transportMissionSchema.index({ destinationHospital: 1, status: 1 });     // Destination hospital's missions
transportMissionSchema.index({ courierId: 1, status: 1 });               // Courier's assigned missions
transportMissionSchema.index({ originHospital: 1, destinationHospital: 1 }); // Bidirectional tenant lookup
transportMissionSchema.index({ 'chainOfCustody.location': '2dsphere' });


const TransportMission = mongoose.model('TransportMission', transportMissionSchema);
export default TransportMission;
