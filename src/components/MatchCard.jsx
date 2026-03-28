import React from "react";
import { calcPts } from "../data";
import ProbBar from "./ProbBar";

export default function MatchCard({ match, prediction, onClick }) {
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

  const predWon = isDone && pred && match.winner === pred.team;
  const predLost = isDone && pred && match.winner && match.winner !== pred.team;

  return (
    <div
      className={`match-card ${isLive ? "live-card" : ""}`}
      onClick={onClick}
    >
      <div className="mc-top">
        <span className="mc-label">{match.label}</span>
        {isLive && <span className="badge-live">● LIVE</span>}
        {match.status === "upcoming" && (
          <span className="badge-upcoming">UPCOMING</span>
        )}
        {isDone && <span className="badge-done">FINAL</span>}
      </div>

      <div className="mc-body">
        <div className="mc-team">
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
          {isLive && (
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

        <div className="mc-team">
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
        <div className="pred-strip">
          <div className="pred-dot" />
          <span className="pred-text">
            You picked <strong>{pred.team || "TBD"}</strong> ·{" "}
            {calcPts(pred.prob)} pts if correct
          </span>
        </div>
      )}

      {isDone && pred && (
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
        <div className="pred-strip">
          <div className="pred-dot" style={{ background: "var(--muted)" }} />
          <span className="pred-text" style={{ color: "var(--muted)" }}>
            Tap to make your prediction
          </span>
        </div>
      )}
    </div>
  );
}
