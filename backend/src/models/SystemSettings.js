import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'IOT_SIMULATOR_ENABLED'
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: false
  },
  updatedBy: {
    type: String,
    default: 'PLATFORM_ADMIN'
  }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
