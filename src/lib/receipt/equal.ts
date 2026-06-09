/**
 * Order-insensitive structural equality for receiptData blobs.
 *
 * Postgres jsonb does not preserve key order on read, so a `JSON.stringify`
 * compare between an outgoing payload and a value round-tripped from the DB
 * can spuriously report inequality. This walks both values structurally so
 * key order is irrelevant.
 *
 * Scope is intentionally narrow: receiptData is plain JSON (objects, arrays,
 * strings, numbers, booleans, null) — no Dates, Maps, Sets, or class
 * instances. Adding support for those would invite drift.
 */
export function receiptDataEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!receiptDataEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, k)) return false;
    if (!receiptDataEqual(aObj[k], bObj[k])) return false;
  }
  return true;
}
