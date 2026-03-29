import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "pitchiq-auth",
      },
    })
  : null;

const AUTH_INTENT_KEY = "pitchiq-auth-intent";
const TEAM_CACHE_KEY = "pitchiq-team-cache-v2";
const TEAM_CACHE_TTL_MS = 4 * 60 * 60 * 1000;
const LIVE_STATUSES = new Set([
  "in play",
  "stumps",
  "lunch",
  "innings break",
  "drinks",
  "timeout",
  "tea",
]);
const UPCOMING_STATUSES = new Set([
  "scheduled",
  "unknown",
  "no live coverage",
  "match delayed",
  "postponed",
]);
const COMPLETED_STATUSES = new Set([
  "finished",
  "cancelled",
  "abandoned",
]);

const TEAM_BG = "#0B5ED7";
const TEAM_FG = "#FFFFFF";

function hostedTeamLogoUrl(teamId) {
  return `/team-logos/${teamId}.png`;
}

function readTeamCache() {
  try {
    const raw = localStorage.getItem(TEAM_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.cachedAt || !Array.isArray(parsed.teams)) return null;
    if (Date.now() - parsed.cachedAt > TEAM_CACHE_TTL_MS) return null;

    return parsed.teams;
  } catch {
    return null;
  }
}

function writeTeamCache(teams) {
  localStorage.setItem(
    TEAM_CACHE_KEY,
    JSON.stringify({
      cachedAt: Date.now(),
      teams,
    }),
  );
}

export async function loadAndCacheCricketTeams() {
  const cached = readTeamCache();
  if (cached) {
    return cached;
  }

  if (!supabase) {
    return [];
  }

  let data = null;
  {
    const { data: activeData, error: activeError } = await supabase
      .from("cricket_team")
      .select("id, name, abbreviation, logo_url")
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (activeError) {
      console.error("Error fetching active teams:", activeError);
      return [];
    }

      data = activeData;
  }

  const teams = (data ?? []).map((team) => ({
    id: Number(team.id),
    name: team.name,
    abbreviation: team.abbreviation,
    // Serve logos from app origin so Vercel CDN + SW can cache efficiently.
    logoUrl: hostedTeamLogoUrl(team.id),
    sourceLogoUrl: team.logo_url,
  }));

  writeTeamCache(teams);
  return teams;
}

export function buildTeamLookup(teams) {
  return (teams ?? []).reduce((acc, team) => {
    acc[team.id] = team;
    return acc;
  }, {});
}

function parseProbability(value) {
  if (value == null) return null;
  const n = Number.parseFloat(String(value));
  if (!Number.isFinite(n)) return null;

  const normalized = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function parseRuns(score) {
  if (typeof score !== "string") return null;
  const match = score.trim().match(/^(\d+)/);
  if (!match) return null;

  const runs = Number.parseInt(match[1], 10);
  return Number.isFinite(runs) ? runs : null;
}

function parseOvers(info) {
  if (typeof info !== "string") return null;
  const match = info.match(/(\d+(?:\.\d+)?)\s*\/\s*\d+\s*ov/i);
  return match?.[1] ?? null;
}

function normalizeStatus(status) {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  if (COMPLETED_STATUSES.has(normalizedStatus)) return "completed";
  if (LIVE_STATUSES.has(normalizedStatus)) return "live";
  if (UPCOMING_STATUSES.has(normalizedStatus)) return "upcoming";
  return "upcoming";
}

function formatDateLabel(row) {
  const startTime = row?.start_date_time || row?.raw?.startTime || row?.raw?.startDate;
  if (!startTime) return "TBD";

  const dt = new Date(startTime);
  if (Number.isNaN(dt.getTime())) return "TBD";

  const now = new Date();
  const dayOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((dayOnly(dt) - dayOnly(now)) / 86400000);

  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).formatToParts(dt);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const time = `${get("hour")}:${get("minute")} ${get("dayPeriod")} ${get("timeZoneName")}`.replace(/\s+/g, " ").trim();

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Tomorrow, ${time}`;
  if (diffDays === -1) return `Yesterday, ${time}`;

  const date = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(dt);
  return `${date}, ${time}`;
}

function teamColor(name) {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) ^ name.charCodeAt(i);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 35%)`;
}

function getWinnerCode(row, t1, t2) {
  const homeRuns = parseRuns(row.home_score);
  const awayRuns = parseRuns(row.away_score);

  if (homeRuns == null || awayRuns == null || homeRuns === awayRuns) {
    return undefined;
  }

  return homeRuns > awayRuns ? t1 : t2;
}

export function mapDbMatchToFrontend(row, teamLookup = {}) {
  const t1TeamId = Number(row.home_team_id);
  const t2TeamId = Number(row.away_team_id);
  const t1FromDb = teamLookup[t1TeamId];
  const t2FromDb = teamLookup[t2TeamId];
  const t1 = t1FromDb?.abbreviation || row?.raw?.homeTeam?.abbreviation || "TBD";
  const t2 = t2FromDb?.abbreviation || row?.raw?.awayTeam?.abbreviation || "TBD";
  const t1Name = t1FromDb?.name || row?.raw?.homeTeam?.name || "Unknown Team";
  const t2Name = t2FromDb?.name || row?.raw?.awayTeam?.name || "Unknown Team";
  const t1Logo =
    t1FromDb?.logoUrl ||
    t1FromDb?.sourceLogoUrl ||
    row?.raw?.homeTeam?.logo ||
    null;
  const t2Logo =
    t2FromDb?.logoUrl ||
    t2FromDb?.sourceLogoUrl ||
    row?.raw?.awayTeam?.logo ||
    null;
  const status = normalizeStatus(row.status);
  const winner = status === "completed" ? getWinnerCode(row, t1, t2) : undefined;
  const rawStartAt = row?.start_date_time || row?.raw?.startTime || row?.raw?.startDate || null;
  const startAtTs = rawStartAt ? new Date(rawStartAt).getTime() : null;
  const leagueName = row?.raw?.league?.name || "";

  const liveT1p = parseProbability(row.live_home_win_prediction);
  const prematchT1p = parseProbability(row.prematch_home_win_prediction);
  let t1p = liveT1p ?? prematchT1p ?? 50;

  if (status === "completed" && winner) {
    t1p = winner === t1 ? 100 : 0;
  }

  return {
    id: Number(row.id),
    t1,
    t2,
    t1TeamId,
    t2TeamId,
    t1Name,
    t2Name,
    t1Logo,
    t2Logo,
    t1Meta: {
      s: t1,
      name: t1Name,
      bg: teamColor(t1Name),
      fg: TEAM_FG,
      logo: t1Logo,
      em: "🏏",
    },
    t2Meta: {
      s: t2,
      name: t2Name,
      bg: teamColor(t2Name),
      fg: TEAM_FG,
      logo: t2Logo,
      em: "🏏",
    },
    label: leagueName ? `Match · ${leagueName}` : "Match",
    leagueName,
    startAtTs: Number.isFinite(startAtTs) ? startAtTs : null,
    date: formatDateLabel(row),
    venue: row.venue || "Unknown venue",
    status,
    winner,
    t1s: row.home_score || "—",
    t1o: parseOvers(row.home_info) || "",
    t2s: row.away_score || "—",
    t2o: parseOvers(row.away_info) || "",
    t1p,
    statistics: row.raw?.statistics ?? [],
    homeInfoRaw: row.home_info ?? null,
    awayInfoRaw: row.away_info ?? null,
  };
}

function getRedirectUrl() {
  return (
    import.meta.env.VITE_SUPABASE_REDIRECT_URL ||
    `${window.location.origin}${window.location.pathname}`
  );
}

function getInitials(name = "Player") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeProfileFlags(profile) {
  return {
    isAdmin: Boolean(profile?.is_admin),
    isApproved: Boolean(profile?.is_approved),
  };
}

export function mapAuthUser(authUser) {
  if (!authUser) return null;

  const metadata = authUser.user_metadata ?? {};
  const name =
    metadata.full_name ||
    metadata.name ||
    authUser.email?.split("@")[0] ||
    "Player";
  const provider = authUser.app_metadata?.provider || "sso";

  return {
    id: authUser.id,
    name,
    email: authUser.email || "No email available",
    avatarUrl: metadata.avatar_url || null,
    initials: getInitials(name),
    isAdmin: false,
    isApproved: false,
    provider,
  };
}

export function mapClaimsToUser(claims) {
  if (!claims) return null;

  const email = claims.email || "No email available";
  const name = claims.user_metadata?.full_name || claims.user_metadata?.name || email.split("@")[0] || "Player";

  return {
    id: claims.sub,
    name,
    email,
    avatarUrl: claims.user_metadata?.avatar_url || null,
    initials: getInitials(name),
    isAdmin: false,
    isApproved: false,
    provider: claims.app_metadata?.provider || "sso",
  };
}

export async function getAuthenticatedUser() {
  if (!supabase) return null;

  const {
    data: { claims },
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (claimsError || !claims) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return mapClaimsToUser(claims);
  }

  return mapAuthUser(user);
}

export function consumeAuthIntent() {
  const intent = sessionStorage.getItem(AUTH_INTENT_KEY);

  if (intent) {
    sessionStorage.removeItem(AUTH_INTENT_KEY);
  }

  return intent;
}

export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error("Supabase Auth is not configured.");
  }

  sessionStorage.setItem(AUTH_INTENT_KEY, "google");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getRedirectUrl(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    sessionStorage.removeItem(AUTH_INTENT_KEY);
    throw error;
  }

  return data;
}

// not used - use only when you want to trigger SSO without a specific provider (e.g. for enterprise SSO)
export async function signInWithSSO({ domain, providerId }) {
  if (!supabase) {
    throw new Error("Supabase Auth is not configured.");
  }

  sessionStorage.setItem(AUTH_INTENT_KEY, "sso");

  const { data, error } = await supabase.auth.signInWithSSO({
    domain,
    providerId,
    options: {
      redirectTo: getRedirectUrl(),
    },
  });

  if (error) {
    sessionStorage.removeItem(AUTH_INTENT_KEY);
    throw error;
  }

  return data;
}

export async function signOut() {
  if (!supabase) {
    throw new Error("Supabase Auth is not configured.");
  }

  sessionStorage.removeItem(AUTH_INTENT_KEY);

  const { error } = await supabase.auth.signOut({ scope: "local" });
  
  if (error) {
    console.error("Sign out error:", error);
    throw error;
  }

  console.log("User signed out successfully.");
  
  return true;  // Explicit success signal
}

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

/**
 * Upsert a user_profile row from auth user data.
 * Called after sign-in/session restore so display_name / avatar_url stay fresh.
 * Includes insert fallback so profile creation self-heals if DB trigger is missing.
 */
export async function refreshUserProfile(authUser) {
  if (!supabase || !authUser?.id) return null;

  const { data, error } = await supabase
    .from("user_profile")
    .upsert({
      id: authUser.id,
      email: authUser.email,
      display_name: authUser.name,
      avatar_url: authUser.avatarUrl ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("refreshUserProfile error:", error);
  }

  return data ?? null;
}

export async function fetchUserProfileFlags(userId) {
  if (!supabase || !userId) {
    return {
      isAdmin: false,
      isApproved: false,
    };
  }

  const { data, error } = await supabase
    .from("user_profile")
    .select("is_approved, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("fetchUserProfileFlags error:", error);
    return {
      isAdmin: false,
      isApproved: false,
    };
  }

  return normalizeProfileFlags(data);
}

export async function fetchPendingUsers() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_profile")
    .select("id, display_name, email, avatar_url, created_at")
    .eq("is_approved", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchPendingUsers error:", error);
    throw error;
  }

  return (data ?? []).map((row) => ({
    avatarUrl: row.avatar_url ?? null,
    createdAt: row.created_at ?? null,
    email: row.email ?? "No email available",
    id: row.id,
    name: row.display_name || row.email?.split("@")[0] || "Player",
  }));
}

export async function approveUser(userId) {
  if (!supabase || !userId) {
    return {
      data: null,
      error: new Error("Supabase not configured"),
    };
  }

  const { data, error } = await supabase
    .from("user_profile")
    .update({
      is_approved: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, is_approved")
    .single();

  return {
    data: data ?? null,
    error: error ?? null,
  };
}

// ─── PREDICTIONS ──────────────────────────────────────────────────────────────

/**
 * Upsert a prediction (one row per user+match enforced by unique key).
 * Returns the saved row including the DB-assigned id and timestamps.
 *
 * @param {object} opts
 * @param {string} opts.userId          - auth user uuid
 * @param {number} opts.matchId         - cricket_matches.id
 * @param {number} opts.pickedTeamId    - cricket_team.id
 * @param {number} opts.probabilityAtPick - 0-100 numeric
 */
export async function upsertPrediction({ userId, matchId, pickedTeamId, probabilityAtPick }) {
  if (!supabase) return { data: null, error: new Error("Supabase not configured") };

  const { data, error } = await supabase
    .from("user_predictions")
    .upsert(
      {
        user_id: userId,
        match_id: matchId,
        picked_team_id: pickedTeamId,
        probability_at_pick: probabilityAtPick,
        result: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" },
    )
    .select()
    .single();

  return { data: data ?? null, error: error ?? null };
}

/**
 * Request AI match help from the Supabase Edge Function.
 * Expected function name: ai-help
 */
export async function requestAiMatchHelp({ matchId, mode }) {
  if (!supabase) {
    return {
      data: null,
      error: new Error("Supabase not configured"),
    };
  }

  const allowAnonFallback = import.meta.env.VITE_AI_HELP_ALLOW_ANON === "true";
  const requestBody = { matchId, mode };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const invokeWithToken = async (token) =>
    supabase.functions.invoke("ai-help", {
      body: requestBody,
      headers: {
        apikey: supabasePublishableKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let { data, error } = await invokeWithToken(session?.access_token);

  let status = error?.context?.status ?? error?.status;
  if (status === 401) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession();

    if (!refreshError && refreshed?.session?.access_token) {
      const retry = await invokeWithToken(refreshed.session.access_token);
      data = retry.data;
      error = retry.error;
      status = error?.context?.status ?? error?.status;
    }
  }

  // Fallback to anon key if JWT fails and anon fallback is enabled
  if (status === 401 && allowAnonFallback) {
    const anonRetry = await invokeWithToken(null);
    data = anonRetry.data;
    error = anonRetry.error;
    status = error?.context?.status ?? error?.status;
  }

  return {
    data: data ?? null,
    error: error ?? null,
  };
}

/**
 * Load all predictions for the signed-in user, including the match
 * abbreviations for display.
 * Returns array of prediction rows with joined match data.
 */
export async function fetchMyPredictions(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from("user_predictions")
    .select(`
      id,
      match_id,
      picked_team_id,
      probability_at_pick,
      result,
      points_awarded,
      picked_at,
      settled_at,
      cricket_matches (
        id,
        home_team_id,
        away_team_id,
        status
      ),
      picked_team:cricket_team!picked_team_id (
        id,
        abbreviation,
        name
      )
    `)
    .eq("user_id", userId)
    .order("picked_at", { ascending: false });

  if (error) {
    console.error("fetchMyPredictions error:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    matchId: row.match_id,
    pickedTeamId: row.picked_team_id,
    picked: row.picked_team?.abbreviation ?? "TBD",
    pickedName: row.picked_team?.name ?? "Unknown",
    pickedEmoji: "🏏",
    prob: Number(row.probability_at_pick),
    result: row.result === "correct" ? "won" : row.result === "incorrect" ? "lost" : row.result,
    pts: row.points_awarded != null ? Number(row.points_awarded) : null,
    pickedAt: row.picked_at,
    settledAt: row.settled_at,
    matchStatus: row.cricket_matches?.status ?? null,
    // home/away team ids preserved for label resolution if needed
    homeTeamId: row.cricket_matches?.home_team_id ?? null,
    awayTeamId: row.cricket_matches?.away_team_id ?? null,
  }));
}

// ─── CROWD PICK COUNTS ────────────────────────────────────────────────────────

/**
 * Fetch aggregated pick counts for a set of matches via SECURITY DEFINER RPC.
 * Uses get_match_pick_counts() which bypasses per-user RLS on user_predictions
 * but only returns COUNT aggregates — no user_id is ever exposed.
 *
 * @param {number[]} matchIds
 * @returns {Promise<Record<number, Record<number, number>>>}
 *   Shape: { matchId → { teamId → count } }
 */
export async function fetchMatchPickCounts(matchIds) {
  if (!supabase || !matchIds?.length) return {};

  const { data, error } = await supabase.rpc("get_match_pick_counts", {
    p_match_ids: matchIds,
  });

  if (error) {
    console.error("fetchMatchPickCounts error:", error);
    return {};
  }

  const result = {};
  for (const row of data ?? []) {
    const mid = Number(row.match_id);
    const tid = Number(row.picked_team_id);
    if (!result[mid]) result[mid] = {};
    result[mid][tid] = Number(row.pick_count);
  }
  return result;
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────

/**
 * Check if the current user has already used AI help for a specific match.
 * Queries the user_ai_help_usage table to enforce one-time-use per match.
 */
export async function checkAiHelpUsed(userId, matchId) {
  if (!supabase || !userId || !matchId) return false;

  const { data, error } = await supabase
    .from("user_ai_help_usage")
    .select("id")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .limit(1)
    .single();

  if (error) {
    // Table may not exist or no row found — both are valid, assume not used
    return false;
  }

  return Boolean(data?.id);
}

/**
 * Record that the user has used AI help for a match.
 * Called after successful AI help request.
 */
export async function recordAiHelpUsage(userId, matchId) {
  if (!supabase || !userId || !matchId) return { data: null, error: null };

  return supabase
    .from("user_ai_help_usage")
    .insert({
      user_id: userId,
      match_id: matchId,
      used_at: new Date().toISOString(),
    })
    .select()
    .single();
}

/**
 * Fetch the full leaderboard from the DB view, ordered by rank.
 * Shape matches the old LB_DATA: { user_id, name, av, pts, correct, total, rank }.
 * Also marks the current user's row with isMe: true.
 */
export async function fetchLeaderboard(currentUserId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("leaderboard")
    .select("user_id, name, av, pts, correct, total, rank")
    .order("rank", { ascending: true });

  if (error) {
    console.error("fetchLeaderboard error:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.user_id,
    name: row.name,
    av: row.av,
    pts: Number(row.pts),
    correct: row.correct,
    total: row.total,
    rank: row.rank,
    isMe: row.user_id === currentUserId,
  }));
}
