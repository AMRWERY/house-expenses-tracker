/**
 * Households: who can see and change which data.
 *
 * Every protected route calls requireScope(event, minimumRole). The household comes from the `active_household` cookie, but the
 * cookie is only a REQUEST: the server checks the person's membership and role every time, and falls back to their personal
 * household. A household id sent by a client is never trusted. Design: docs/superpowers/specs/2026-11-15-households-and-offline-design.md
 */
export type Role = "owner" | "admin" | "member" | "viewer";
const RANK: Record<Role, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };
export const MAX_MEMBERS = 10;
export const MAX_OWNED_HOUSEHOLDS = 5;
const INVITE_DAYS = 7;

/** Who is asking and for which household; every data query filters on `householdId`. */
export interface Scope {
  userId: string;
  householdId: string;
  role: Role;
  personal: boolean;
}

const fail = (statusCode: number, message: string) => createError({ statusCode, message });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isRole = (v: unknown): v is Role => typeof v === "string" && v in RANK;
export const atLeast = (role: Role, min: Role) => RANK[role] >= RANK[min];

// ---- Scope -------------------------------------------------------------------------------------------------------

/** The person's personal household id, created the first time it is needed. */
export async function ensurePersonalHousehold(userId: string): Promise<string> {
  const db = useSupabase();
  const find = async () =>
    must(await db.from("households").select("id").eq("owner_id", userId).eq("personal", true).maybeSingle());
  const existing = await find();
  if (existing) return existing.id;

  const created = await db.from("households").insert({ owner_id: userId, name: "Personal", personal: true }).select("id").single();
  if (created.error) {
    // Two requests raced to create it: the unique index let one win, so use that one.
    const winner = await find();
    if (winner) return winner.id;
    console.error("[supabase]", created.error.code, created.error.message);
    throw fail(500, "database_error");
  }
  must(await db.from("household_members").upsert({ household_id: created.data.id, user_id: userId, role: "owner" }, { onConflict: "household_id,user_id" }));
  return created.data.id;
}

/** The person's role in a household, or null when they are not a member. */
async function roleIn(userId: string, householdId: string): Promise<{ role: Role; personal: boolean } | null> {
  const db = useSupabase();
  const member = must(
    await db.from("household_members").select("role").eq("household_id", householdId).eq("user_id", userId).maybeSingle(),
  );
  if (!member || !isRole(member.role)) return null;
  const h = must(await db.from("households").select("personal").eq("id", householdId).maybeSingle());
  return h ? { role: member.role, personal: h.personal } : null;
}

export async function resolveScope(event: Parameters<typeof getCookie>[0], userId: string): Promise<Scope> {
  const wanted = getCookie(event, "active_household");
  if (wanted && UUID_RE.test(wanted)) {
    const found = await roleIn(userId, wanted);
    if (found) return { userId, householdId: wanted, ...found };
  }
  const householdId = await ensurePersonalHousehold(userId);
  return { userId, householdId, role: "owner", personal: true };
}

/** Authenticate, resolve the household, and require at least `min` role in it (403 otherwise). */
export async function requireScope(event: Parameters<typeof getCookie>[0], min: Role = "viewer"): Promise<Scope> {
  const { user } = await requireUserSession(event);
  const scope = await resolveScope(event, user.id);
  if (!atLeast(scope.role, min)) throw fail(403, "forbidden");
  return scope;
}

/** Members may change their own records; admins and owners may change anyone's. */
export const canChangeRecord = (scope: Scope, createdBy: string | null) =>
  atLeast(scope.role, "admin") || createdBy === scope.userId;

// ---- Names and emails ----------------------------------------------------------------------------------------------

async function authUser(userId: string) {
  const { data, error } = await useSupabase().auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  return data.user;
}

/** The person's verified account email (never the session cookie's copy), or null if it isn't confirmed. */
async function verifiedEmail(userId: string) {
  const u = await authUser(userId);
  if (!u?.email || !u.email_confirmed_at) return null;
  return u.email.toLowerCase();
}

// ---- Households ----------------------------------------------------------------------------------------------------

export interface HouseholdSummary {
  id: string;
  name: string;
  personal: boolean;
  role: Role;
  members: number;
  active: boolean;
}

export async function listMyHouseholds(scope: Scope): Promise<HouseholdSummary[]> {
  const db = useSupabase();
  const mine = must(await db.from("household_members").select("household_id, role").eq("user_id", scope.userId)) ?? [];
  const ids = mine.map((m) => m.household_id);
  if (!ids.length) return [];
  const [houses, members] = await Promise.all([
    db.from("households").select("id, name, personal").in("id", ids),
    db.from("household_members").select("household_id").in("household_id", ids),
  ]);
  const counts = new Map<string, number>();
  for (const m of must(members) ?? []) counts.set(m.household_id, (counts.get(m.household_id) ?? 0) + 1);
  return (must(houses) ?? [])
    .map((h) => ({
      id: h.id,
      name: h.name,
      personal: h.personal,
      role: (mine.find((m) => m.household_id === h.id)?.role ?? "viewer") as Role,
      members: counts.get(h.id) ?? 1,
      active: h.id === scope.householdId,
    }))
    .sort((a, b) => Number(b.personal) - Number(a.personal) || a.name.localeCompare(b.name));
}

export function parseHouseholdName(body: unknown) {
  const raw = ((body ?? {}) as Record<string, unknown>).name;
  const name = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (name.length < 1 || name.length > 40) throw fail(400, "invalid_name");
  return name;
}

export async function createHousehold(userId: string, name: string) {
  const db = useSupabase();
  const { count, error } = await db
    .from("households")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("personal", false);
  if (error) throw fail(500, "database_error");
  if ((count ?? 0) >= MAX_OWNED_HOUSEHOLDS) throw fail(409, "household_limit");
  const h = must(await db.from("households").insert({ owner_id: userId, name }).select("id, name").single())!;
  must(await db.from("household_members").insert({ household_id: h.id, user_id: userId, role: "owner" }));
  return { id: h.id, name: h.name };
}

/** The household must be a shared one (never the personal one). */
function assertShared(scope: Scope) {
  if (scope.personal) throw fail(409, "personal_household");
}

export async function renameHousehold(scope: Scope, name: string) {
  assertShared(scope);
  must(await useSupabase().from("households").update({ name, updated_at: new Date().toISOString() }).eq("id", scope.householdId));
}

/** Owner only. Deletes the household and everything in it (cascade). */
export async function deleteHousehold(scope: Scope) {
  assertShared(scope);
  must(await useSupabase().from("households").delete().eq("id", scope.householdId));
}

// ---- Members -------------------------------------------------------------------------------------------------------

export interface MemberRecord {
  userId: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  you: boolean;
}

export async function listMembers(scope: Scope): Promise<MemberRecord[]> {
  const rows =
    must(await useSupabase().from("household_members").select("user_id, role, joined_at").eq("household_id", scope.householdId)) ?? [];
  const people = await Promise.all(
    rows.map(async (r) => {
      const u = await authUser(r.user_id);
      const email = u?.email ?? "";
      return {
        userId: r.user_id,
        name: u ? displayNameOf(u, email) : "",
        email,
        role: (isRole(r.role) ? r.role : "viewer") as Role,
        joinedAt: r.joined_at,
        you: r.user_id === scope.userId,
      };
    }),
  );
  return people.sort((a, b) => RANK[b.role] - RANK[a.role] || a.joinedAt.localeCompare(b.joinedAt));
}

/** Is this person a current member? (Used to check who an expense was paid by or split with.) */
export async function memberIds(householdId: string): Promise<Set<string>> {
  const rows = must(await useSupabase().from("household_members").select("user_id").eq("household_id", householdId)) ?? [];
  return new Set(rows.map((r) => r.user_id));
}

async function targetMember(scope: Scope, targetId: string) {
  if (!UUID_RE.test(targetId)) throw fail(400, "invalid_id");
  const row = must(
    await useSupabase().from("household_members").select("role").eq("household_id", scope.householdId).eq("user_id", targetId).maybeSingle(),
  );
  if (!row || !isRole(row.role)) throw fail(404, "not_found");
  return row.role;
}

export function parseRoleInput(body: unknown): Exclude<Role, "owner"> {
  const role = ((body ?? {}) as Record<string, unknown>).role;
  if (role !== "admin" && role !== "member" && role !== "viewer") throw fail(400, "invalid_role");
  return role;
}

/** Change a member's role. Admins manage members and viewers; only the owner can make or change an admin. */
export async function setMemberRole(scope: Scope, targetId: string, role: Exclude<Role, "owner">) {
  assertShared(scope);
  const current = await targetMember(scope, targetId);
  if (current === "owner") throw fail(403, "forbidden"); // ownership moves only through a transfer
  if (targetId === scope.userId) throw fail(403, "forbidden");
  if ((role === "admin" || current === "admin") && scope.role !== "owner") throw fail(403, "forbidden");
  must(await useSupabase().from("household_members").update({ role }).eq("household_id", scope.householdId).eq("user_id", targetId));
}

/**
 * Remove a member, or leave (target = yourself). The owner cannot leave: transfer ownership or delete the household first.
 * Their expenses stay (created_by / paid_by keep pointing at them).
 */
export async function removeMember(scope: Scope, targetId: string) {
  assertShared(scope);
  const current = await targetMember(scope, targetId);
  if (current === "owner") throw fail(409, "owner_cannot_leave");
  if (targetId !== scope.userId) {
    if (!atLeast(scope.role, "admin")) throw fail(403, "forbidden");
    if (current === "admin" && scope.role !== "owner") throw fail(403, "forbidden");
  }
  must(await useSupabase().from("household_members").delete().eq("household_id", scope.householdId).eq("user_id", targetId));
}

/** Owner only: make a member the owner; the previous owner becomes an admin. */
export async function transferOwnership(scope: Scope, targetId: string) {
  assertShared(scope);
  if (targetId === scope.userId) throw fail(400, "invalid_id");
  await targetMember(scope, targetId);
  const db = useSupabase();
  must(await db.from("household_members").update({ role: "owner" }).eq("household_id", scope.householdId).eq("user_id", targetId));
  must(await db.from("household_members").update({ role: "admin" }).eq("household_id", scope.householdId).eq("user_id", scope.userId));
  must(await db.from("households").update({ owner_id: targetId, updated_at: new Date().toISOString() }).eq("id", scope.householdId));
}

// ---- Invitations ---------------------------------------------------------------------------------------------------

export interface InvitationRecord {
  id: string;
  email: string;
  role: Exclude<Role, "owner">;
  expiresAt: string;
  expired: boolean;
}

export function parseInvitationInput(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  return { email: parseEmail(b.email), role: parseRoleInput(b) };
}

export async function createInvitation(scope: Scope, input: { email: string; role: Exclude<Role, "owner"> }) {
  assertShared(scope);
  if (input.role === "admin" && scope.role !== "owner") throw fail(403, "forbidden");
  const db = useSupabase();
  const now = new Date();

  // Retire invitations that already expired, so the same address can be invited again.
  must(
    await db
      .from("household_invitations")
      .update({ revoked_at: now.toISOString() })
      .eq("household_id", scope.householdId)
      .is("accepted_at", null)
      .is("declined_at", null)
      .is("revoked_at", null)
      .lt("expires_at", now.toISOString()),
  );

  const members = await memberIds(scope.householdId);
  const pending =
    must(
      await db
        .from("household_invitations")
        .select("id")
        .eq("household_id", scope.householdId)
        .is("accepted_at", null)
        .is("declined_at", null)
        .is("revoked_at", null),
    ) ?? [];
  if (members.size + pending.length >= MAX_MEMBERS) throw fail(409, "member_limit");

  const expires = new Date(now.getTime() + INVITE_DAYS * 86_400_000);
  const row = must(
    await db
      .from("household_invitations")
      .insert({ household_id: scope.householdId, email: input.email, role: input.role, invited_by: scope.userId, expires_at: expires.toISOString() })
      .select("id, email, role, expires_at")
      .single(),
  )!; // a second open invitation for the same email is a 409 (unique index)
  return { id: row.id, email: row.email, role: row.role as InvitationRecord["role"], expiresAt: row.expires_at, expired: false };
}

export async function listInvitations(scope: Scope): Promise<InvitationRecord[]> {
  const rows =
    must(
      await useSupabase()
        .from("household_invitations")
        .select("id, email, role, expires_at")
        .eq("household_id", scope.householdId)
        .is("accepted_at", null)
        .is("declined_at", null)
        .is("revoked_at", null)
        .order("created_at"),
    ) ?? [];
  const now = Date.now();
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role as InvitationRecord["role"],
    expiresAt: r.expires_at,
    expired: Date.parse(r.expires_at) < now,
  }));
}

export async function revokeInvitation(scope: Scope, id: string) {
  if (!UUID_RE.test(id)) throw fail(400, "invalid_id");
  const row = must(
    await useSupabase()
      .from("household_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("household_id", scope.householdId)
      .is("accepted_at", null)
      .is("declined_at", null)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle(),
  );
  if (!row) throw fail(404, "not_found");
}

export interface MyInvitation {
  id: string;
  household: string;
  role: Exclude<Role, "owner">;
  invitedBy: string;
  expiresAt: string;
}

/** Open invitations addressed to the signed-in person's verified email. */
export async function listMyInvitations(userId: string): Promise<MyInvitation[]> {
  const email = await verifiedEmail(userId);
  if (!email) return [];
  const db = useSupabase();
  const rows =
    must(
      await db
        .from("household_invitations")
        .select("id, household_id, role, invited_by, expires_at")
        .eq("email", email)
        .is("accepted_at", null)
        .is("declined_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString()),
    ) ?? [];
  if (!rows.length) return [];
  const houses = must(await db.from("households").select("id, name").in("id", rows.map((r) => r.household_id))) ?? [];
  return Promise.all(
    rows.map(async (r) => {
      const inviter = r.invited_by ? await authUser(r.invited_by) : null;
      return {
        id: r.id,
        household: houses.find((h) => h.id === r.household_id)?.name ?? "",
        role: r.role as MyInvitation["role"],
        invitedBy: inviter ? displayNameOf(inviter, inviter.email ?? "") : "",
        expiresAt: r.expires_at,
      };
    }),
  );
}

/** Load an invitation that is addressed to this person and still open. */
async function openInvitationFor(userId: string, id: string) {
  if (!UUID_RE.test(id)) throw fail(400, "invalid_id");
  const email = await verifiedEmail(userId);
  const row = must(await useSupabase().from("household_invitations").select("*").eq("id", id).maybeSingle());
  // Same answer whether it doesn't exist or is someone else's: don't reveal which invitations exist
  if (!row || !email || row.email !== email) throw fail(404, "not_found");
  if (row.revoked_at) throw fail(410, "invitation_revoked");
  if (row.accepted_at || row.declined_at) throw fail(409, "invitation_used");
  if (Date.parse(row.expires_at) < Date.now()) throw fail(410, "invitation_expired");
  return row;
}

export async function acceptInvitation(userId: string, id: string) {
  const inv = await openInvitationFor(userId, id);
  const db = useSupabase();
  const members = await memberIds(inv.household_id);
  if (!members.has(userId)) {
    if (members.size >= MAX_MEMBERS) throw fail(409, "member_limit");
    must(await db.from("household_members").insert({ household_id: inv.household_id, user_id: userId, role: inv.role }));
  }
  must(await db.from("household_invitations").update({ accepted_at: new Date().toISOString() }).eq("id", inv.id).is("accepted_at", null));
  return { householdId: inv.household_id };
}

export async function declineInvitation(userId: string, id: string) {
  const inv = await openInvitationFor(userId, id);
  must(await useSupabase().from("household_invitations").update({ declined_at: new Date().toISOString() }).eq("id", inv.id).is("declined_at", null));
}

/**
 * For routes that name a household in the URL (/api/households/<id>/...): the person must be a member of THAT household with
 * at least `min` role. A household they don't belong to answers 404, the same as one that doesn't exist.
 */
export async function requireHouseholdScope(
  event: Parameters<typeof getCookie>[0],
  householdId: string | undefined,
  min: Role = "viewer",
): Promise<Scope> {
  const { user } = await requireUserSession(event);
  if (!householdId || !UUID_RE.test(householdId)) throw fail(404, "not_found");
  const found = await roleIn(user.id, householdId);
  if (!found) throw fail(404, "not_found");
  if (!atLeast(found.role, min)) throw fail(403, "forbidden");
  return { userId: user.id, householdId, ...found };
}
