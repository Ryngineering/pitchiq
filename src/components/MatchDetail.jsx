import { useEffect, useMemo, useRef, useState } from "react";
import { calcPts } from "../data";
import ProbBar from "./ProbBar";
import { checkAiHelpUsed } from "../lib/supabase";
import {
  ChevronLeft,
  RefreshCw,
  Check,
  Clock,
  X,
  ShieldAlert,
  Settings,
} from "lucide-react";

const AI_LOADING_QUIPS = [
  "Reading the pitch report...",
  "Crunching match data...",
  "Consulting the cricket gods...",
  "Analysing batting intent...",
  "Checking the run-rate tea leaves...",
];

/* ── Cricket overs math ──────────────────────────────────────────────── */

function oversToDecimal(overs) {
  if (overs == null) return 0;
  const n = Number(overs);
  if (!Number.isFinite(n)) return 0;
  const whole = Math.floor(n);
  const balls = Math.round((n - whole) * 10); // e.g. 11.2 → balls = 2
  return whole + balls / 6;
}

function oversToBalls(overs) {
  if (overs == null) return 0;
  const n = Number(overs);
  if (!Number.isFinite(n)) return 0;
  const whole = Math.floor(n);
  const balls = Math.round((n - whole) * 10);
  return whole * 6 + balls;
}

function ballsToOversString(totalBalls) {
  const whole = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${whole}.${balls}`;
}

function getTeamOversFromStats(match, teamId) {
  if (!match?.statistics?.length || teamId == null) return "";

  const totalBalls = match.statistics
    .filter((stat) => String(stat?.team?.id) === String(teamId))
    .reduce((teamBalls, stat) => {
      const bowlers = stat?.team?.inningBowlers;
      if (!Array.isArray(bowlers)) return teamBalls;

      const inningBalls = bowlers.reduce(
        (sum, bowler) => sum + oversToBalls(bowler?.overs),
        0,
      );

      return teamBalls + inningBalls;
    }, 0);

  return `(${ballsToOversString(totalBalls)}) ov`;
}

function abbreviateName(fullName) {
  if (!fullName) return "—";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

/* ── Extract live stats from match.statistics ────────────────────────── */

function extractLiveStats(match) {
  const stats = match.statistics;
  if (!stats || !stats.length) return null;

  // Current innings = last entry in the array
  const currentInning = stats[stats.length - 1];
  const team = currentInning.team;
  const inningNumber = currentInning.inningNumber ?? stats.length;
  const is2ndInnings = inningNumber === 2;

  // Parse current score from match scores
  // The batting team could be home or away — match team id to determine
  const battingTeamId = team?.id;
  const isHomeBatting = String(battingTeamId) === String(match.t1TeamId);
  const scoreStr = isHomeBatting ? match.t1s : match.t2s;
  const oversStr = isHomeBatting ? match.t1o : match.t2o;
  const infoStr = isHomeBatting ? match.homeInfoRaw : match.awayInfoRaw;

  // Parse runs from score string like "94/3"
  const scoreMatch = String(scoreStr ?? "").match(/^(\d+)/);
  const runs = scoreMatch ? Number.parseInt(scoreMatch[1], 10) : 0;

  // Parse overs from parsed overs string or info string
  let overs = 0;
  if (oversStr) {
    overs = Number(oversStr) || 0;
  } else if (infoStr) {
    const ovMatch = infoStr.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*\d+\s*)?ov/i);
    if (ovMatch) overs = Number(ovMatch[1]) || 0;
  }

  const oversDecimal = oversToDecimal(overs);
  const crr = oversDecimal > 0 ? (runs / oversDecimal).toFixed(2) : "0.00";

  // Target + RRR (2nd innings only)
  let target = null;
  let rrr = null;
  let runsNeeded = null;
  let ballsRemaining = null;

  if (is2ndInnings) {
    // Try parsing target from info strings (format: "T:202")
    const homeTarget = String(match.homeInfoRaw ?? "").match(/T:(\d+)/);
    const awayTarget = String(match.awayInfoRaw ?? "").match(/T:(\d+)/);
    const targetMatch = homeTarget || awayTarget;
    if (targetMatch) {
      target = Number.parseInt(targetMatch[1], 10);
    } else {
      // Fallback: first innings score + 1
      const firstInning = stats[0];
      if (firstInning) {
        const firstTeamId = firstInning.team?.id;
        const isFirstHome = String(firstTeamId) === String(match.t1TeamId);
        const firstScoreStr = isFirstHome ? match.t1s : match.t2s;
        const firstScoreMatch = String(firstScoreStr ?? "").match(/^(\d+)/);
        if (firstScoreMatch) {
          target = Number.parseInt(firstScoreMatch[1], 10) + 1;
        }
      }
    }

    if (target != null) {
      runsNeeded = target - runs;
      if (runsNeeded < 0) runsNeeded = 0;
      const totalBalls = 120; // T20
      const ballsBowled = oversToBalls(overs);
      ballsRemaining = totalBalls - ballsBowled;
      if (ballsRemaining < 0) ballsRemaining = 0;

      const oversRemDec = ballsRemaining / 6;
      rrr = oversRemDec > 0 ? (runsNeeded / oversRemDec).toFixed(2) : "—";
    }
  }

  // Batters at crease — from last partnership
  const partnerships =
    team?.inningPartnerships ?? currentInning.team?.inningPartnerships ?? [];
  const batsmen =
    team?.inningBatsmen ?? currentInning.team?.inningBatsmen ?? [];
  const fallOfWickets =
    team?.fallOfWickets ?? currentInning.team?.fallOfWickets ?? [];
  const dismissedNames = new Set(
    fallOfWickets.map((w) => w.dismissalBatsman?.name),
  );

  let battersAtCrease = [];
  if (partnerships.length > 0) {
    const lastPartnership = partnerships[partnerships.length - 1];
    const names = [
      lastPartnership.firstPlayer?.name,
      lastPartnership.secondPlayer?.name,
    ].filter(Boolean);

    battersAtCrease = names.map((name) => {
      const batter = batsmen.find((b) => b.player?.name === name);
      return {
        name,
        abbrevName: abbreviateName(name),
        runs: batter?.runs ?? 0,
        balls: batter?.balls ?? 0,
        sr: batter?.battingStrikeRate ?? 0,
        isNotOut: !dismissedNames.has(name),
      };
    });
  }

  // All bowlers in this innings
  const bowlers =
    team?.inningBowlers ?? currentInning.team?.inningBowlers ?? [];
  const allBowlers = bowlers.map((b) => ({
    name: b.player?.name ?? "Unknown",
    abbrevName: abbreviateName(b.player?.name),
    wickets: b.wickets ?? 0,
    concededRuns: b.concededRuns ?? 0,
    overs: b.overs ?? 0,
    economy: b.economy ?? 0,
  }));

  return {
    battingTeam: team?.abbreviation ?? "—",
    inningNumber,
    is2ndInnings,
    runs,
    overs,
    crr,
    target,
    rrr,
    runsNeeded,
    ballsRemaining,
    battersAtCrease,
    allBowlers,
  };
}

export default function MatchDetail({
  match,
  currentUserId,
  prediction,
  onPredict,
  onBack,
  onSettings,
  onSignOut,
  aiHelpEnabled: aiHelpEnabledProp,
  onRequestAiHelp,
}) {
  const [selected, setSelected] = useState(null);
  const [changing, setChanging] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [localAiPayload, setLocalAiPayload] = useState(null);
  const [aiAlreadyUsedFromDb, setAiAlreadyUsedFromDb] = useState(false);
  const [aiCheckingDb, setAiCheckingDb] = useState(true);
  const [aiResultOpen, setAiResultOpen] = useState(false);
  const [aiLoadingQuip, setAiLoadingQuip] = useState(AI_LOADING_QUIPS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  const isDone = match.status === "completed";
  const isLive = match.status === "live";

  const defaultTab = isDone ? "points" : "predict";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const t1 = match.t1Meta || {
    s: match.t1 || "TBD",
    name: match.t1Name || "Unknown Team",
    bg: "#0B5ED7",
    fg: "#FFFFFF",
    em: "🏏",
    logo: match.t1Logo || null,
  };
  const t2 = match.t2Meta || {
    s: match.t2 || "TBD",
    name: match.t2Name || "Unknown Team",
    bg: "#0B5ED7",
    fg: "#FFFFFF",
    em: "🏏",
    logo: match.t2Logo || null,
  };
  const t2p = 100 - match.t1p;
  const hasPred = prediction && !changing;

  const t1RawScore = String(match.t1s ?? "").trim();
  const t2RawScore = String(match.t2s ?? "").trim();
  const t1Score =
    isLive && (!t1RawScore || t1RawScore === "—") ? "0/0" : t1RawScore;
  const t2Score =
    isLive && (!t2RawScore || t2RawScore === "—") ? "0/0" : t2RawScore;

  const t1Info = getTeamOversFromStats(match, match.t1TeamId);
  const t2Info = getTeamOversFromStats(match, match.t2TeamId);

  const pred = prediction;
  const predWon = isDone && pred && match.winner === pred.team;

  const aiHelpEnabled =
    aiHelpEnabledProp ?? import.meta.env.VITE_AI_HELP_ENABLED !== "false";
  const aiHelpPayload = match.aiHelpPayload ?? localAiPayload;
  const aiHelpUsed = Boolean(
    match.aiHelpUsed || aiHelpPayload || aiAlreadyUsedFromDb,
  );
  const shouldShowAiFab =
    !isDone &&
    !aiHelpUsed &&
    !aiResultOpen &&
    !aiError &&
    !(currentUserId && aiCheckingDb);

  const liveStats = useMemo(
    () => (isLive ? extractLiveStats(match) : null),
    [isLive, match],
  );

  // Determine current innings label for the hero VS area
  const inningsLabel = liveStats
    ? `${liveStats.inningNumber === 1 ? "1st" : "2nd"} innings`
    : null;

  useEffect(() => {
    setAiLoading(false);
    setAiError(null);
    setAiResultOpen(false);
    // AI result is transient — cleared on match change
    setLocalAiPayload(null);
  }, [match.id]);

  // Close settings dropdown when clicking outside.
  useEffect(() => {
    if (!showSettings) return undefined;
    const handleClick = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);

  // Check if user has already used AI help for this match (from DB)
  useEffect(() => {
    setAiCheckingDb(true);
    setAiAlreadyUsedFromDb(false);

    if (!currentUserId || !match?.id) {
      setAiCheckingDb(false);
      return;
    }

    let cancelled = false;

    const loadUsage = async () => {
      const hasUsed = await checkAiHelpUsed(currentUserId, match.id);

      if (cancelled) {
        return;
      }

      setAiAlreadyUsedFromDb(hasUsed);
      setAiCheckingDb(false);
    };

    void loadUsage();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, match?.id]);

  const handleConfirm = () => {
    if (!selected) return;
    const prob = selected === match.t1 ? match.t1p : t2p;
    const pickedTeamId =
      selected === match.t1 ? match.t1TeamId : match.t2TeamId;
    onPredict(match.id, selected, prob, pickedTeamId);
    setChanging(false);
    setSelected(null);
  };

  const handleTabClick = (tab) => {
    if (tab === "live" && !isLive) return;
    setActiveTab(tab);
  };

  const buildFallbackAiPayload = (mode) => {
    const probability = Number(match.t1p ?? 50);
    const recommendHome = probability >= 50;
    const recommended = recommendHome
      ? {
          id: match.t1TeamId,
          name: t1.name,
          abbreviation: t1.s,
        }
      : {
          id: match.t2TeamId,
          name: t2.name,
          abbreviation: t2.s,
        };

    const confidence = Math.round(
      recommendHome ? probability : 100 - probability,
    );
    const upside = mode === "contrarian" ? "higher-upside" : "higher-safety";

    return {
      mode,
      confidence,
      headline: `${recommended.abbreviation} has the ${upside} setup right now`,
      recommendedTeam: recommended,
      insights: [
        `Live model gives ${recommended.abbreviation} a stronger win edge at this phase.`,
        `Recent run-rate pressure favors ${recommended.abbreviation} if wickets are preserved.`,
        `Top-order impact and current match context suggest a stable path to close this out.`,
      ],
      riskWarning:
        "One wicket cluster or a 15+ run over can rapidly swing the balance in T20.",
      invalidationConditions: [
        "Two wickets in the next 12 balls",
        "Required rate jumps by 2.0+ within one over",
      ],
      sources: [],
    };
  };

  const handleAiFabClick = async () => {
    // Already used — show toast-like message
    if (aiHelpUsed) {
      setAiError("AI prediction for this match already generated.");
      setTimeout(() => setAiError(null), 3000);
      return;
    }
    if (!aiHelpEnabled || isDone || aiLoading || aiCheckingDb) return;

    setAiLoading(true);
    setAiError(null);
    setAiLoadingQuip(
      AI_LOADING_QUIPS[Math.floor(Math.random() * AI_LOADING_QUIPS.length)],
    );

    try {
      let payload;
      if (onRequestAiHelp) {
        payload = await onRequestAiHelp({ matchId: match.id, mode: "value" });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1700));
        payload = buildFallbackAiPayload("value");
      }

      setLocalAiPayload(payload);
      setAiResultOpen(true);
    } catch (error) {
      if (error?.code === "AI_HELP_ALREADY_USED") {
        setAiAlreadyUsedFromDb(true);
      }
      setAiError(error?.message || "Unable to generate AI guidance right now.");
      setTimeout(() => setAiError(null), 3500);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="header">
        <button
          className="md-back-btn"
          onClick={onBack}
          aria-label="Back to matches"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="header-logo">🏏 PITCHIQ</span>
        <div className="md-header-right">
          {aiHelpUsed && !isDone && !aiResultOpen && (
            <span className="ai-used-chip">🤖 AI used</span>
          )}
          <div className="settings-wrap" ref={settingsRef}>
            <button
              className="settings-btn"
              aria-label="Settings"
              onClick={() => setShowSettings((value) => !value)}
            >
              <Settings size={16} />
            </button>
            {showSettings && (
              <div className="settings-dropdown">
                <button
                  className="settings-item"
                  onClick={() => {
                    setShowSettings(false);
                    if (onSignOut) {
                      onSignOut();
                      return;
                    }
                    onSettings?.();
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="screen-pad">
        <div className="match-hero">
          <div className="big-teams">
            <div className="big-team">
              <div className="big-logo" style={{ background: t1.bg }}>
                {match.t1Logo ? (
                  <img
                    src={match.t1Logo}
                    alt={match.t1Name || t1.name}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 40 }}>{t1.em}</span>
                )}
              </div>
              <span className="big-name">{t1.s}</span>
              {t1Score && <span className="big-score">{t1Score}</span>}
              {match.status !== "upcoming" && t1Info && (
                <span className="big-overs">{t1Info}</span>
              )}
            </div>
            <div className="big-vs">
              {isLive && (
                <span className="badge-live big-status-badge">● LIVE</span>
              )}
              {match.status === "upcoming" && (
                <span className="badge-upcoming big-status-badge">
                  UPCOMING
                </span>
              )}
              {isDone && (
                <span className="badge-done big-status-badge">FINAL</span>
              )}
              <span className="big-vs-text">VS</span>
              {inningsLabel && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--green)",
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  {inningsLabel}
                </span>
              )}
            </div>
            <div className="big-team">
              <div className="big-logo" style={{ background: t2.bg }}>
                {match.t2Logo ? (
                  <img
                    src={match.t2Logo}
                    alt={match.t2Name || t2.name}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 40 }}>{t2.em}</span>
                )}
              </div>
              <span className="big-name">{t2.s}</span>
              {t2Score && <span className="big-score">{t2Score}</span>}
              {match.status !== "upcoming" && t2Info && (
                <span className="big-overs">{t2Info}</span>
              )}
            </div>
          </div>

          {/* ── TAB BUTTONS ── */}
          <div className="match-tabs">
            <button
              className={`match-tab ${activeTab === "live" ? "active" : ""} ${!isLive ? "disabled" : ""}`}
              onClick={() => handleTabClick("live")}
            >
              LIVE
            </button>
            <button
              className={`match-tab ${activeTab === "predict" ? "active" : ""}`}
              onClick={() => handleTabClick("predict")}
            >
              PREDICT
            </button>
            <button
              className={`match-tab ${activeTab === "points" ? "active" : ""}`}
              onClick={() => handleTabClick("points")}
            >
              POINTS
            </button>
          </div>
        </div>

        {/* ═══════════════ LIVE TAB ═══════════════ */}
        {activeTab === "live" && isLive && (
          <div className="live-stats">
            {liveStats ? (
              <>
                {/* Chase banner — 2nd innings only */}
                {liveStats.is2ndInnings && liveStats.target != null && (
                  <div className="live-chase-banner">
                    <span className="chase-need">
                      Need {liveStats.runsNeeded} off {liveStats.ballsRemaining}{" "}
                      balls
                    </span>
                    <span className="chase-target">
                      Target {liveStats.target}
                    </span>
                  </div>
                )}

                {/* CRR / RRR stat cards */}
                <div className="live-stat-grid">
                  <div className="live-stat-card">
                    <div className="live-stat-label">CRR</div>
                    <div className="live-stat-value">{liveStats.crr}</div>
                    <div className="live-stat-desc">per over</div>
                  </div>
                  {liveStats.is2ndInnings && liveStats.rrr != null && (
                    <div className="live-stat-card">
                      <div className="live-stat-label">RRR</div>
                      <div className="live-stat-value rrr">{liveStats.rrr}</div>
                      <div className="live-stat-desc">needed</div>
                    </div>
                  )}
                </div>

                {/* At the Crease */}
                {liveStats.battersAtCrease.length > 0 && (
                  <div className="live-crease">
                    <div className="live-crease-title">AT THE CREASE</div>
                    {liveStats.battersAtCrease.map((batter) => (
                      <div className="live-batter-row" key={batter.name}>
                        <span className="batter-indicator" />
                        <span className="batter-name">{batter.abbrevName}</span>
                        <span className="batter-runs">
                          {batter.runs}
                          {batter.isNotOut ? "*" : ""}
                        </span>
                        <span className="batter-balls">({batter.balls})</span>
                        <span className="batter-sr">SR {batter.sr}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bowlers */}
                {liveStats.allBowlers.length > 0 && (
                  <div className="live-bowlers">
                    <div className="live-bowlers-title">BOWLING</div>
                    <div className="live-bowlers-header">
                      <span className="bwl-h-name">BOWLER</span>
                      <span className="bwl-h-stat">OV</span>
                      <span className="bwl-h-stat">W/R</span>
                      <span className="bwl-h-stat">ECON</span>
                    </div>
                    {liveStats.allBowlers.map((b) => (
                      <div className="live-bowler-row" key={b.name}>
                        <span className="bwl-name">{b.abbrevName}</span>
                        <span className="bwl-stat">{b.overs}</span>
                        <span className="bwl-stat">
                          {b.wickets}/{b.concededRuns}
                        </span>
                        <span className="bwl-stat">{b.economy}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  padding: "24px 16px",
                  fontSize: 13,
                  color: "var(--muted)",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                Live stats will appear once the match data updates
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ PREDICT TAB ═══════════════ */}
        {activeTab === "predict" && (
          <div className="match-detail-content">
            <div className="prob-section predict-prob">
              <div className="prob-section-label">WIN PROBABILITY</div>
              <ProbBar
                t1p={match.t1p}
                t1Label={t1.s}
                t2Label={t2.s}
                t1Color={t1.bg}
                t2Color={t2.bg}
                size="lg"
              />
              {isLive && (
                <div className="prob-update-note">
                  <span className="live-dot" /> Updates live as match progresses
                </div>
              )}
              {match.status === "upcoming" && (
                <div className="prob-update-note">
                  <Clock size={10} /> Pre-match prediction · Updates at toss
                </div>
              )}
            </div>

            {/* Completed → show result + verdict */}
            {isDone && (
              <>
                <div className="result-card">
                  <div className="result-label">MATCH RESULT</div>
                  <div className="result-winner">
                    {match.winner === match.t1
                      ? t1.name
                      : match.winner === match.t2
                        ? t2.name
                        : "Draw"}{" "}
                    Won!
                  </div>
                  <div className="result-margin">
                    {match.winner === match.t1
                      ? `${match.t1s} vs ${match.t2s}`
                      : `${match.t2s} vs ${match.t1s}`}
                  </div>
                </div>
                {pred && (
                  <div
                    className={`user-result-card ${predWon ? "won" : "lost"}`}
                  >
                    <span className="user-result-icon">
                      {predWon ? "🎉" : "😔"}
                    </span>
                    <div className="user-result-info">
                      <div
                        className={`user-result-title ${predWon ? "won" : "lost"}`}
                      >
                        {predWon ? "You called it!" : "Better luck next time"}
                      </div>
                      <div className="user-result-sub">
                        You picked {pred.team || "TBD"} at {pred.prob}%
                        probability
                      </div>
                    </div>
                    {predWon ? (
                      <span className="user-result-pts won">+{pred.pts}</span>
                    ) : (
                      <span className="user-result-pts lost">—</span>
                    )}
                  </div>
                )}
                {!pred && (
                  <div
                    style={{
                      padding: "0 16px 14px",
                      fontSize: 13,
                      color: "var(--muted)",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    You didn&apos;t make a prediction for this match
                  </div>
                )}
              </>
            )}

            {/* Active (live or upcoming) → prediction panel */}
            {!isDone && (
              <>
                {hasPred && (
                  <div className="curr-pred-card">
                    <div className="cpred-row">
                      <div>
                        <div className="cpred-label">YOUR PREDICTION</div>
                        <div className="cpred-val">
                          {pred.team || "TBD"} to win
                        </div>
                      </div>
                    </div>
                    <div className="cpred-pts-row">
                      <span className="cpred-pts-label">Points if correct</span>
                      <span className="cpred-pts-val">
                        +{calcPts(pred.prob)} pts
                      </span>
                    </div>
                  </div>
                )}

                {hasPred && (
                  <div className="pred-switch-wrap">
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        marginBottom: 8,
                      }}
                    >
                      OR SWITCH YOUR PICK
                    </div>
                    <div className="pred-btns">
                      <button
                        className={`pred-btn-compact ${pred.team === match.t1 ? "current" : ""}`}
                        onClick={() => {
                          if (pred.team !== match.t1) {
                            setChanging(true);
                            setSelected(match.t1);
                          }
                        }}
                      >
                        <span className="pred-btn-short">{t1.s}</span>
                        <span className="pred-btn-pts-sm">
                          +{calcPts(match.t1p)} pts
                        </span>
                      </button>
                      <button
                        className={`pred-btn-compact ${pred.team === match.t2 ? "current" : ""}`}
                        onClick={() => {
                          if (pred.team !== match.t2) {
                            setChanging(true);
                            setSelected(match.t2);
                          }
                        }}
                      >
                        <span className="pred-btn-short">{t2.s}</span>
                        <span className="pred-btn-pts-sm">
                          +{calcPts(t2p)} pts
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {!hasPred && (
                  <div className="pred-panel">
                    <div className="pred-panel-title">
                      {changing
                        ? "Change Your Prediction"
                        : "Make Your Prediction"}
                    </div>
                    <div className="pred-btns">
                      <button
                        className={`pred-btn ${selected === match.t1 ? "selected" : ""}`}
                        onClick={() => setSelected(match.t1)}
                      >
                        <span className="pred-btn-em">{t1.em}</span>
                        <span className="pred-btn-short">{t1.s}</span>
                        <span className="pred-btn-if">If correct:</span>
                        <span className="pred-btn-pts">
                          +{calcPts(match.t1p)}
                        </span>
                      </button>
                      <button
                        className={`pred-btn ${selected === match.t2 ? "selected" : ""}`}
                        onClick={() => setSelected(match.t2)}
                      >
                        <span className="pred-btn-em">{t2.em}</span>
                        <span className="pred-btn-short">{t2.s}</span>
                        <span className="pred-btn-if">If correct:</span>
                        <span className="pred-btn-pts">+{calcPts(t2p)}</span>
                      </button>
                    </div>

                    {changing && (
                      <button
                        className="change-btn"
                        style={{ marginBottom: 10, fontSize: 13 }}
                        onClick={() => setChanging(false)}
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      className="confirm-btn"
                      disabled={!selected}
                      onClick={handleConfirm}
                    >
                      <Check size={18} />{" "}
                      {changing ? "Confirm Change" : "Lock In Prediction"}
                    </button>

                    {isLive && (
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 11,
                          color: "var(--muted)",
                          fontWeight: 700,
                          textAlign: "center",
                          lineHeight: 1.5,
                        }}
                      >
                        ⏱ Changing prediction during a live match gives points
                        based on current probability
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════ POINTS TAB ═══════════════ */}
        {activeTab === "points" && (
          <div className="match-detail-content">
            <div className="scoring-info">
              <div className="si-title">⚡ HOW POINTS WORK</div>
              <div className="si-row">
                <span className="si-text">
                  Pick {t1.s} ({match.t1p}% {match.t1p >= t2p ? "fav" : "dog"})
                  & win
                </span>
                <span className="si-pts">+{calcPts(match.t1p)}</span>
              </div>
              <div className="si-row">
                <span className="si-text">
                  Pick {t2.s} ({t2p}% {t2p >= match.t1p ? "fav" : "dog"}) & win
                </span>
                <span className="si-pts">+{calcPts(t2p)}</span>
              </div>
            </div>
            <div
              style={{
                padding: "0 16px 16px",
                fontSize: 12,
                color: "var(--muted)",
                fontWeight: 600,
                lineHeight: 1.6,
                textAlign: "center",
              }}
            >
              Backing the underdog pays more. Points are awarded inverse to win
              probability — the bigger the upset, the bigger the reward.
            </div>
          </div>
        )}
      </div>

      {/* ── Floating AI Bot FAB ── */}
      {shouldShowAiFab && (
        <div className="ai-fab-stack">
          <button
            className={`ai-fab ${aiLoading ? "spinning" : ""}`}
            onClick={handleAiFabClick}
            aria-label="AI Prediction"
            disabled={aiLoading}
          >
            <span className="ai-fab-halo" />
            <span className="ai-fab-icon">🤖</span>
          </button>

          {aiLoading && (
            <div
              className="ai-fab-loading-quip"
              role="status"
              aria-live="polite"
            >
              {aiLoadingQuip}
            </div>
          )}

          {aiError && !aiLoading && (
            <div className="ai-fab-error-toast">
              <ShieldAlert size={13} />
              <span>{aiError}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Folding AI Result Panel ── */}
      {aiResultOpen && aiHelpPayload && (
        <div className="ai-result-overlay">
          <div className="ai-result-panel">
            <button
              className="ai-result-close"
              onClick={() => setAiResultOpen(false)}
              aria-label="Close AI result"
            >
              <X size={18} />
            </button>

            <div className="ai-result-shell">
              <div className="ai-result-top">
                <div className="ai-result-headline">
                  {aiHelpPayload.headline}
                </div>
                <div className="ai-conf-pill">
                  {aiHelpPayload.confidence}% confidence
                </div>
              </div>

              <div className="ai-pick-row">
                <span className="ai-pick-label">Suggested pick</span>
                <span className="ai-pick-team">
                  {aiHelpPayload.recommendedTeam?.abbreviation || "TBD"}
                </span>
              </div>

              <ul className="ai-bullets">
                {(aiHelpPayload.insights || []).slice(0, 4).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>

              <div className="ai-risk-note">
                <span>Risk:</span> {aiHelpPayload.riskWarning}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
