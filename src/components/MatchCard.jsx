import React from "react";
import { calcPts } from "../data";
import ProbBar from "./ProbBar";

function oversToBalls(overs) {
  const n = Number(overs);
  if (!Number.isFinite(n) || n < 0) return 0;
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

function sanitizeMatchLabel(label) {
  const raw = String(label ?? "").trim();
  if (!raw) return "";

  return raw
    .replace(/\s*[·-]\s*IPL\s*\d{0,4}\b/gi, "")
    .replace(/\bIPL\s*\d{0,4}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function MatchCard({
  match,
  prediction,
  onClick,
  displayLabel,
  pickCounts,
}) {
  const [isCrowdOpen, setIsCrowdOpen] = React.useState(false);
  const isTouchMode = React.useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(hover: none)").matches;
  }, []);

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

  const isDone = match.status === "completed";
  const isLive = match.status === "live";
  const pred = prediction;
  const hasPrediction = Boolean(pred) && !isDone;
  const needsPrediction = !pred && !isDone;

  const t1RawScore = String(match.t1s ?? "").trim();
  const t2RawScore = String(match.t2s ?? "").trim();
  const t1Score =
    isLive && (!t1RawScore || t1RawScore === "—") ? "0/0" : t1RawScore;
  const t2Score =
    isLive && (!t2RawScore || t2RawScore === "—") ? "0/0" : t2RawScore;

  const t1Info = getTeamOversFromStats(match, match.t1TeamId);
  const t2Info = getTeamOversFromStats(match, match.t2TeamId);
  const cardLabel = sanitizeMatchLabel(displayLabel || match.label);

  const predWon = isDone && pred && match.winner === pred.team;
  const predLost = isDone && pred && match.winner && match.winner !== pred.team;
  const t2p = 100 - match.t1p;
  const pointsPotential = hasPrediction
    ? (pred.pts ?? calcPts(pred.prob))
    : Math.max(calcPts(match.t1p), calcPts(t2p));

  let pickedSide = null;
  if (pred?.team) {
    if (pred.team === t1.s || pred.team === t1.name) pickedSide = "t1";
    if (pred.team === t2.s || pred.team === t2.name) pickedSide = "t2";
  }

  // Crowd pick data (only meaningful for non-completed matches)
  const totalPicks = Object.values(pickCounts ?? {}).reduce((a, b) => a + b, 0);
  let crowdFavId = null;
  let crowdFavCount = 0;
  for (const [tid, cnt] of Object.entries(pickCounts ?? {})) {
    if (Number(cnt) > crowdFavCount) {
      crowdFavCount = Number(cnt);
      crowdFavId = Number(tid);
    }
  }
  const crowdFavTeam =
    crowdFavId === match.t1TeamId
      ? t1.s
      : crowdFavId === match.t2TeamId
        ? t2.s
        : null;
  const crowdMessage =
    totalPicks === 0 || !crowdFavTeam
      ? "Be the trendsetter ✨"
      : `${crowdFavCount}/${totalPicks} picked ${crowdFavTeam}`;

  const handleCrowdClick = (event) => {
    if (!isTouchMode) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setIsCrowdOpen((prev) => !prev);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={`match-card ${isLive ? "live-card" : ""} ${needsPrediction ? "needs-prediction" : ""} ${hasPrediction ? "has-prediction" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${t1.s} versus ${t2.s} ${needsPrediction ? "prediction pending" : hasPrediction ? "prediction made" : "match details"}`}
    >
      <div className="mc-top">
        <span className="mc-label">
          {cardLabel || displayLabel || match.label}
        </span>
        <div className="mc-top-right">
          {isLive && <span className="badge-live">● LIVE</span>}
          {match.status === "upcoming" && (
            <span className="badge-upcoming">UPCOMING</span>
          )}
          {isDone && <span className="badge-done">FINAL</span>}
          {needsPrediction && <span className="badge-cta">PICK NOW</span>}
          {hasPrediction && <span className="badge-picked">✓ PICKED</span>}
          {!isDone && (
            <span className="mc-pts-pill">
              {hasPrediction
                ? `${pointsPotential} pts`
                : `Up to ${pointsPotential} pts`}
            </span>
          )}
        </div>
      </div>

      <div className="mc-body">
        <div className={`mc-team ${pickedSide === "t1" ? "picked-team" : ""}`}>
          <div className="mc-logo" style={{ background: t1.bg }}>
            {t1.logo ? (
              <img
                src={t1.logo}
                alt={match.t1Name || t1.name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span>{t1.em}</span>
            )}
          </div>
          <span
            className="mc-short"
            style={{ color: t1.fg === "#FFFFFF" ? "#fff" : t1.bg }}
          >
            {t1.s}
          </span>
          {t1Score && <span className="mc-score">{t1Score}</span>}
          {t1Info && <span className="mc-score-info">{t1Info}</span>}
        </div>

        <div className="mc-mid">
          <span className="mc-vs">VS</span>
          <span className="mc-venue">{match.venue?.split(",")[0]}</span>
          {isLive && match.currentOver && (
            <span
              style={{ fontSize: 10, color: "var(--green)", fontWeight: 800 }}
            >
              Ov {match.currentOver}
            </span>
          )}
          {match.status === "upcoming" && (
            <span
              style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}
            >
              {match.date}
            </span>
          )}
        </div>

        <div className={`mc-team ${pickedSide === "t2" ? "picked-team" : ""}`}>
          <div className="mc-logo" style={{ background: t2.bg }}>
            {t2.logo ? (
              <img
                src={t2.logo}
                alt={match.t2Name || t2.name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span>{t2.em}</span>
            )}
          </div>
          <span
            className="mc-short"
            style={{ color: t2.fg === "#FFFFFF" ? "#fff" : t2.bg }}
          >
            {t2.s}
          </span>
          {t2Score && <span className="mc-score">{t2Score}</span>}
          {t2Info && <span className="mc-score-info">{t2Info}</span>}
        </div>
      </div>

      {!isDone && (
        <ProbBar
          t1p={match.t1p}
          t1Label={t1.s}
          t2Label={t2.s}
          t1Color={t1.bg}
          t2Color={t2.bg}
        />
      )}

      {pred && !isDone && (
        <div className="pred-strip pred-strip-picked">
          <div className="pred-dot pred-dot-picked" />
          <span className="pred-text">
            Picked <strong>{pred.team || "TBD"}</strong> to win
          </span>
          <button
            type="button"
            className={`mc-crowd ${isTouchMode ? "touch" : ""} ${isCrowdOpen ? "open" : ""}`}
            onClick={handleCrowdClick}
            aria-label="View crowd picks"
            aria-expanded={isTouchMode ? isCrowdOpen : undefined}
          >
            <span className="mc-crowd-icon">👥</span>
            <span className="mc-crowd-short">
              {totalPicks > 0 ? totalPicks : "?"}
            </span>
            <span className="mc-crowd-full">{crowdMessage}</span>
          </button>
        </div>
      )}

      {isDone && (
        <div className="winner-strip">
          <span className="winner-text">
            {match.winner ? `${match.winner} won` : "Match drawn"}
            {pred ? ` · You picked ${pred.team || "TBD"}` : ""}
          </span>
          {predWon && <span className="winner-pts">+{pred.pts} pts ✓</span>}
          {predLost && <span className="loser-pts">—</span>}
          {!pred && <span className="loser-pts">No pick</span>}
        </div>
      )}

      {!pred && !isDone && (
        <div className="pred-strip pred-strip-cta">
          <div className="pred-dot pred-dot-cta" />
          <span className="pred-text pred-text-cta">Tap to predict</span>
          <button
            type="button"
            className={`mc-crowd ${isTouchMode ? "touch" : ""} ${isCrowdOpen ? "open" : ""}`}
            onClick={handleCrowdClick}
            aria-label="View crowd picks"
            aria-expanded={isTouchMode ? isCrowdOpen : undefined}
          >
            <span className="mc-crowd-icon">👥</span>
            <span className="mc-crowd-short">
              {totalPicks > 0 ? totalPicks : "?"}
            </span>
            <span className="mc-crowd-full">{crowdMessage}</span>
          </button>
        </div>
      )}
    </div>
  );
}
