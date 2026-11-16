const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A uuid from a URL path; anything else is a 400, never a database error. */
export const parseUuid = (raw: string | undefined) => {
  if (!raw || !UUID_RE.test(raw)) throw createError({ statusCode: 400, message: "invalid_id" });
  return raw;
};
