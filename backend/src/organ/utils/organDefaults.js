/**
 * Default configurations for various organ types.
 * Cold Ischemia limits are defined in hours.
 */
export const ORGAN_DEFAULTS = Object.freeze({
  KIDNEY: {
    code: 'KID',
    defaultColdIschemiaTimeLimitHours: 36, // 24-36 hrs
    minTemp: 0.0,
    maxTemp: 4.0,
    notes: '0–4°C. Also increasingly uses machine perfusion (hypothermic, ~4-8°C) to extend viability beyond static storage.',
  },
  LIVER: {
    code: 'LIV',
    defaultColdIschemiaTimeLimitHours: 12, // 8-12 hrs
    minTemp: 0.0,
    maxTemp: 4.0,
    notes: '0–4°C. Machine perfusion (both hypothermic and normothermic) increasingly used.',
  },
  HEART: {
    code: 'HRT',
    defaultColdIschemiaTimeLimitHours: 6, // 4-6 hrs
    minTemp: 3.0,
    maxTemp: 5.0,
    notes: '4°C (Tight range 3-5°C). Very time-sensitive even at cold temp; newer "warm perfusion" devices keep it beating at near-body temp (~34-37°C) instead.',
  },
  LUNGS: {
    code: 'LNG',
    defaultColdIschemiaTimeLimitHours: 8, // 6-8 hrs
    minTemp: 4.0,
    maxTemp: 8.0,
    notes: '4–8°C. Ex-vivo lung perfusion (EVLP) systems can recondition lungs at normothermic temps before transplant.',
  },
  PANCREAS: {
    code: 'PAN',
    defaultColdIschemiaTimeLimitHours: 18, // 12-18 hrs
    minTemp: 0.0,
    maxTemp: 4.0,
    notes: '0–4°C. Very sensitive to warm ischemia (islet cells damage quickly).',
  },
  CORNEA: {
    code: 'COR',
    defaultColdIschemiaTimeLimitHours: 336, // ~14 days if preserved properly
    minTemp: 2.0,
    maxTemp: 8.0,
    notes: '2–8°C (short-term) or -196°C (liquid nitrogen, for long-term eye bank storage). Corneas tolerate much longer storage.',
  },
});
