# Security & Deployment Notes

## Environment Variables

- **Required**:
  - `NODE_ENV` (`development` | `production`)
  - `PORT`
  - `MONGODB_URI`
  - `JWT_SECRET`
- **Recommended**:
  - `ENFORCE_2FA`  
    - `true` in production to enforce TOTP for high‑privilege roles (PLATFORM_ADMIN, APPROPRIATE_AUTHORITY, ROTTO_SOTTO_OFFICER, AUTHORIZATION_COMMITTEE_MEMBER, TRANSPLANT_SURGEON).
    - `false` in local dev for convenience.
  - `ENABLE_COMPLIANCE_CRON`  
    - `true` to run the daily THOTA expiry cron job.
  - SMTP settings (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`) for email notifications.

Copy `.env.example` to `.env` and fill in your values. Never commit `.env`.

## Rate Limiting

- General API routes: 100 requests per 15 minutes per IP.
- Auth endpoints (login, 2FA): 20 requests per 15 minutes.
- Critical admin actions (hospital approve/suspend, AC approvals, brain death sign): 10 requests per 15 minutes.

Adjust limits in `src/config/rateLimit.js` if needed.

## 2FA Enforcement

- High‑privilege roles should have TOTP enabled and enforced in production.
- The `requireAuth` middleware checks `ENFORCE_2FA`:
  - If `true` and user has `isTotpEnabled=true`, TOTP is mandatory.
  - If `false`, TOTP is bypassed (dev only).

Ensure all admin and medical staff accounts have TOTP configured before enabling in prod.

## THOTA Expiry Cron

- Runs daily at 02:00 IST if `ENABLE_COMPLIANCE_CRON=true`.
- Marks hospitals with expired `thota.validUntil` as `EXPIRED`, emits `HOSPITAL_THOTA_EXPIRED` audit events, and triggers email notifications (currently stubbed in `src/utils/notificationStub.js`).

## Health Check

- `GET /health` returns:
  ```json
  {
    "status": "ok",
    "uptime": <seconds>,
    "env": "<NODE_ENV>",
    "timestamp": "<ISO timestamp>"
  }
  ```
- Use this for load balancer / container health checks.

## Basic Security Checklist (Production)

- [ ] Strong, random `JWT_SECRET`.
- [ ] `ENFORCE_2FA=true` for high‑privilege roles.
- [ ] HTTPS enabled at reverse proxy / load balancer.
- [ ] MongoDB access restricted to application servers only.
- [ ] Regular backups of MongoDB.
- [ ] Monitoring & alerting on:
  - Error rates.
  - Failed login attempts.
  - Cron job failures (check logs).
