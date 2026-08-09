import SystemSettings from '../../models/SystemSettings.js';

// Default RFID card UIDs (will be overwritten when Admin sets them)
const DEFAULT_RFID_CARDS = {
  RFID_CARD_1_UID: '3913DDB7',
  RFID_CARD_2_UID: '19DB5AB7',
  RFID_CARD_3_UID: '29EE69B7',
};

/**
 * GET /api/v1/system/settings
 * Returns all system settings: simulator toggle + RFID card UIDs
 */
export const getSettings = async (req, res, next) => {
  try {
    // 1. Simulator toggle
    let simulatorSetting = await SystemSettings.findOne({ key: 'IOT_SIMULATOR_ENABLED' });
    if (!simulatorSetting) {
      simulatorSetting = await SystemSettings.create({
        key: 'IOT_SIMULATOR_ENABLED',
        value: false,
        updatedBy: 'SYSTEM'
      });
    }

    // 2. RFID Card UIDs — seed defaults if not yet set
    const rfidSettings = {};
    for (const [key, defaultVal] of Object.entries(DEFAULT_RFID_CARDS)) {
      let s = await SystemSettings.findOne({ key });
      if (!s) {
        s = await SystemSettings.create({ key, value: defaultVal, updatedBy: 'SYSTEM' });
      }
      rfidSettings[key] = s.value;
    }

    res.status(200).json({
      success: true,
      settings: {
        IOT_SIMULATOR_ENABLED: simulatorSetting.value,
        ...rfidSettings,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/system/settings
 * Update any system setting by key
 */
export const updateSetting = async (req, res, next) => {
  try {
    const { key = 'IOT_SIMULATOR_ENABLED', value } = req.body;

    const setting = await SystemSettings.findOneAndUpdate(
      { key },
      { value, updatedBy: req.user?.email || 'PLATFORM_ADMIN', updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Setting ${key} updated to ${value}`,
      setting
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/system/rfid-cards
 * Returns all 3 RFID card UIDs — used by device.controller for matching
 */
export const getRfidCards = async () => {
  const cards = {};
  for (const [key, defaultVal] of Object.entries(DEFAULT_RFID_CARDS)) {
    const s = await SystemSettings.findOne({ key });
    cards[key] = s ? s.value : defaultVal;
  }
  return cards;
};
