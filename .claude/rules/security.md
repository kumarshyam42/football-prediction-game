# Security Hardening

Full security audit performed Feb 2025 and fixes deployed in two phases.

## Phase 1 — Invisible Fixes (no UX change)
- Timing-safe admin auth: `lib/auth.js` uses `crypto.timingSafeEqual` instead of `===`
- Shared auth module: All 8 admin endpoints use `lib/auth.js` (must live outside `/api/` to avoid Vercel's 12-function Hobby plan limit)
- Input validation: Scores must be integers 0-99, player names max 100 chars, team names max 100 chars
- XSS fix in admin panel: Replaced inline `onclick` handlers with `data-*` attributes + event delegation
- Security headers in `vercel.json`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (no geolocation/mic/camera)
- CORS restricted from `*` to `https://games.shyamkumar.com`
- Error messages stripped: All 500 responses return generic "Internal server error" (no `error.message` or stack traces)
- Sensitive console.log removed from predictions API
- Pinned lucide-static CDN from `@latest` to `@0.563.0`

## Phase 2 — Admin Auth via Header
- Admin key no longer passed via `?key=SECRET` in the URL (leaked in browser history, server logs, referrer headers)
- All admin pages (`admin.html`, `cleanup.html`, `setup.html`, `migrate.html`) now show a login form
- Key stored in `sessionStorage` (clears when tab closes), sent via `x-admin-key` header
- Backend `lib/auth.js` only accepts `x-admin-key` header (no query param fallback)
- If any API call returns 403, user is prompted to re-authenticate

## Not Addressed (lower priority)
- Rate limiting on API endpoints (would need external service or edge middleware)
- Content Security Policy header (risk of breaking inline styles)
- Subresource Integrity for CDN imports (needs testing)
