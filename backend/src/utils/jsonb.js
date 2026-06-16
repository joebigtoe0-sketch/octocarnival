/** Normalize values for Postgres JSON/JSONB parameters. */
function toJsonb(value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

function toBytea(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  throw new Error('Expected binary image data');
}

module.exports = { toJsonb, toBytea };
