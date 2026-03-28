import React from "react";
import { calcPts } from "../data";

export default function MatchCard({
  match,
  prediction,
  onClick,
  displayLabel,
  pickCounts,
}) {
  const toRgba = (hex, alpha, fallback = `rgba(255,255,255,${alpha})`) => {
    if (!hex || typeof hex !== "string") return fallback;
    const cleanHex = hex.trim().replace("#", "");
    if (!/^[\da-fA-F]{6}$/.test(cleanHex)) return fallback;
    const intVal = Number.parseInt(cleanHex, 16);
    const r = (intVal >> 16) & 255;
    const g = (intVal >> 8) & 255;
    const b = intVal & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

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
  const t1p = Math.min(100, Math.max(0, Number(match.t1p ?? 50)));

  const predWon = isDone && pred && match.winner === pred.team;
  const predLost = isDone && pred && match.winner && match.winner !== pred.team;
  const t2p = 100 - t1p;
  const pointsPotential = hasPrediction
    ? (pred.pts ?? calcPts(pred.prob))
    : Math.max(calcPts(t1p), calcPts(t2p));

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
        <span className="mc-label">{displayLabel || match.label}</span>
        <div className="mc-top-right">
          {isLive && <span className="badge-live">● LIVE</span>}
          {match.status === "upcoming" && (
            <span className="badge-upcoming">UPCOMING</span>
          )}
          {isDone && <span className="badge-done">FINAL</span>}
          {!isDone && (
            <span className="mc-pts-pill">
              {hasPrediction
                ? `${pointsPotential} pts`
                : `Up to ${pointsPotential} pts`}
            </span>
          )}
        </div>
      </div>

      <div className="mc-body mc-body-split">
        <div
          className={`mc-team mc-side ${pickedSide === "t1" ? "picked-team" : ""}`}
          style={{
            background: `linear-gradient(90deg, ${toRgba(t1.bg, 0.52, "rgba(255,255,255,0.52)")} 0%, ${toRgba(t1.bg, 0.18, "rgba(255,255,255,0.18)")} 100%)`,
          }}
        >
          <div
            className="mc-logo mc-logo-lg"
            style={{ background: "transparent" }}
          >
            {t1.logo ? (
              <img
                src={t1.logo}
                alt={match.t1Name || t1.name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span>{t1.em}</span>
            )}
          </div>
          <span className="mc-win-pct">{t1p}% Win Probability</span>
          <span
            className="mc-short"
            style={{ color: t1.fg === "#FFFFFF" ? "#fff" : t1.bg }}
          >
            {t1.s}
          </span>
          {match.t1s && <span className="mc-score">{match.t1s}</span>}
        </div>

        <div className="mc-mid-divider" />

        <div
          className={`mc-team mc-side ${pickedSide === "t2" ? "picked-team" : ""}`}
          style={{
            background: `linear-gradient(270deg, ${toRgba(t2.bg, 0.52, "rgba(255,255,255,0.52)")} 0%, ${toRgba(t2.bg, 0.18, "rgba(255,255,255,0.18)")} 100%)`,
          }}
        >
          <div
            className="mc-logo mc-logo-lg"
            style={{ background: "transparent" }}
          >
            {t2.logo ? (
              <img
                src={t2.logo}
                alt={match.t2Name || t2.name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span>{t2.em}</span>
            )}
          </div>
          <span className="mc-win-pct">{t2p}% Win Probability</span>
          <span
            className="mc-short"
            style={{ color: t2.fg === "#FFFFFF" ? "#fff" : t2.bg }}
          >
            {t2.s}
          </span>
          {match.t2s && <span className="mc-score">{match.t2s}</span>}
        </div>
      </div>

      {pred && !isDone && (
        <div className="pred-strip pred-strip-picked">
          <div className="pred-dot pred-dot-picked" />
          <span className="pred-text">
            My pick: <strong>{pred.team || "TBD"}</strong>
          </span>
          <div className="mc-crowd">
            <span className="mc-crowd-icon">👥</span>
            <span className="mc-crowd-short">
              {totalPicks > 0 ? totalPicks : "?"}
            </span>
            <span className="mc-crowd-full">
              {totalPicks === 0 || !crowdFavTeam
                ? "Be the trendsetter ✨"
                : `${crowdFavCount}/${totalPicks} picked ${crowdFavTeam}`}
            </span>
          </div>
        </div>
      )}

      {isDone && (
        <div className="winner-strip">
          <span className="winner-text">
            {match.winner ? `${match.winner} won` : "Match drawn"}
            {pred ? ` · You chose ${pred.team || "TBD"}` : ""}
          </span>
          {predWon && <span className="winner-pts">+{pred.pts} pts ✓</span>}
          {predLost && <span className="loser-pts">—</span>}
          {!pred && <span className="loser-pts">No pick</span>}
        </div>
      )}

      {!pred && !isDone && (
        <div className="pred-strip pred-strip-cta">
          <div className="pred-dot pred-dot-cta" />
          <span className="pred-text pred-text-cta">Make your prediction</span>
          <div className="mc-crowd">
            <span className="mc-crowd-icon">👥</span>
            <span className="mc-crowd-short">
              {totalPicks > 0 ? totalPicks : "?"}
            </span>
            <span className="mc-crowd-full">
              {totalPicks === 0 || !crowdFavTeam
                ? "Be the trendsetter ✨"
                : `${crowdFavCount}/${totalPicks} picked ${crowdFavTeam}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
