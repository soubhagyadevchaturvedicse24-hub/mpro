/**
 * passwordPolicy.util.js
 * Server-side password strength validation.
 *
 * This runs on the backend independently of any frontend validation
 * so that weak passwords cannot be submitted via direct API calls.
 *
 * Rules (mirrors the frontend strength meter):
 *  - Minimum 12 characters
 *  - At least 1 uppercase letter
 *  - At least 1 lowercase letter
 *  - At least 1 digit
 *  - At least 1 special character (!@#$%^&* etc.)
 */

const RULES = [
  {
    id:      'minLength',
    label:   'At least 12 characters',
    test:    (p) => p.length >= 12,
  },
  {
    id:      'uppercase',
    label:   'At least one uppercase letter (A–Z)',
    test:    (p) => /[A-Z]/.test(p),
  },
  {
    id:      'lowercase',
    label:   'At least one lowercase letter (a–z)',
    test:    (p) => /[a-z]/.test(p),
  },
  {
    id:      'digit',
    label:   'At least one digit (0–9)',
    test:    (p) => /[0-9]/.test(p),
  },
  {
    id:      'special',
    label:   'At least one special character (!@#$%^&*...)',
    test:    (p) => /[^A-Za-z0-9]/.test(p),
  },
];

/**
 * Returns a score 0–5 and a list of failed rule labels.
 *
 * @param {string} password
 * @returns {{ score: number, passed: boolean, failures: string[] }}
 */
export const evaluatePassword = (password) => {
  if (typeof password !== 'string') {
    return { score: 0, passed: false, failures: RULES.map((r) => r.label) };
  }

  const failures = RULES
    .filter((rule) => !rule.test(password))
    .map((rule) => rule.label);

  return {
    score:   RULES.length - failures.length, // 0–5
    passed:  failures.length === 0,
    failures,
  };
};

/**
 * Throws a structured error if the password does not meet policy.
 * Call this in controllers/services before creating a User.
 *
 * @param {string} password
 * @throws {{ code, message, status, details }}
 */
export const enforcePasswordPolicy = (password) => {
  const { passed, failures } = evaluatePassword(password);
  if (!passed) {
    throw {
      code:    'AUTH_PASSWORD_POLICY',
      message: 'Password does not meet the minimum security requirements.',
      status:  400,
      details: failures,
    };
  }
};
