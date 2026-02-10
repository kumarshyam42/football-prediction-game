const crypto = require('crypto');

function isAdmin(req) {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedKey = req.headers['x-admin-key'];

  if (!adminSecret || !providedKey) return false;

  try {
    const secretBuffer = Buffer.from(String(adminSecret));
    const keyBuffer = Buffer.from(String(providedKey));

    if (secretBuffer.length !== keyBuffer.length) return false;

    return crypto.timingSafeEqual(secretBuffer, keyBuffer);
  } catch {
    return false;
  }
}

module.exports = { isAdmin };
