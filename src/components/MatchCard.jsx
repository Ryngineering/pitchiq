import React from "react";
import { calcPts } from "../data";
import ProbBar from "./ProbBar";

export default function MatchCard({
  match,
  prediction,
  onClick,
  displayLabel,
}) {
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
          {!isDone && (
            <span className="mc-pts-pill">
              {hasPrediction
                ? `${pointsPotential} pts`
                : `Up to ${pointsPotential} pts`}
            </span>
          )}
          {isLive && <span className="badge-live">● LIVE</span>}
          {match.status === "upcoming" && (
            <span className="badge-upcoming">UPCOMING</span>
          )}
          {isDone && <span className="badge-done">FINAL</span>}
          {needsPrediction && <span className="badge-cta">PICK NOW</span>}
          {hasPrediction && <span className="badge-picked">✓ PICKED</span>}
        </div>
      </div>

      <div className="mc-body">
        <div className={`mc-team ${pickedSide === "t1" ? "picked-team" : ""}`}>
          <div className="mc-logo" style={{ background: t1.bg }}>
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
          <span
            className="mc-short"
            style={{ color: t1.fg === "#FFFFFF" ? "#fff" : t1.bg }}
          >
            {t1.s}
          </span>
          {match.t1s && <span className="mc-score">{match.t1s}</span>}
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
          {match.t2s && <span className="mc-score">{match.t2s}</span>}
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
          <span className="pred-text pred-text-cta">
            Tap anywhere to make your prediction
          </span>
        </div>
      )}
    </div>
  );
}
