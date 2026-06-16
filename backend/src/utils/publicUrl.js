/** Ensure asset/metadata URLs are absolute https links (wallets require this). */
function normalizePublicUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let u = url.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  return u;
}

module.exports = { normalizePublicUrl };
