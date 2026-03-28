import React from "react";
import MatchCard from "./MatchCard";
import { Bell } from "lucide-react";

function buildDisplayLabel(match, sequence) {
  const base = `Match ${sequence}`;
  return match.leagueName ? `${base} · ${match.leagueName}` : base;
}

function byMatchStartThenId(a, b) {
  const aTs = Number.isFinite(a.startAtTs)
    ? a.startAtTs
    : Number.MAX_SAFE_INTEGER;
  const bTs = Number.isFinite(b.startAtTs)
    ? b.startAtTs
    : Number.MAX_SAFE_INTEGER;
  if (aTs !== bTs) return aTs - bTs;
  return a.id - b.id;
}

export default function HomeScreen({
  matches,
  predictions,
  onMatch,
  myPoints,
  onBell,
  pickCounts,
  streak,
}) {
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const done = matches.filter((m) => m.status === "completed");

  const sequenceByMatchId = React.useMemo(() => {
    const ordered = [...matches].sort(byMatchStartThenId);
    const next = {};
    ordered.forEach((match, idx) => {
      next[match.id] = idx + 1;
    });
    return next;
  }, [matches]);

  return (
    <div className="screen">
      <div className="header">
        <span className="header-logo">🏏 PITCHIQ</span>
        <div className="header-right">
          {streak >= 3 && (
            <span className="streak-chip">🔥 {streak} in a row</span>
          )}
          <span className="pts-chip">⚡ {myPoints} PTS</span>
          <button className="bell-btn" onClick={onBell}>
            <Bell size={16} color="rgba(255,255,255,0.6)" />
            <div className="bell-dot" />
          </button>
        </div>
      </div>

      <div className="screen-pad">
        {live.length > 0 && (
          <div className="section">
            <div className="section-title">🟢 Live Now</div>
            {live.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                displayLabel={buildDisplayLabel(m, sequenceByMatchId[m.id])}
                prediction={predictions[m.id]}
                pickCounts={pickCounts?.[m.id]}
                onClick={() => onMatch(m.id)}
              />
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="section">
            <div className="section-title">⏳ Upcoming</div>
            {upcoming.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                displayLabel={buildDisplayLabel(m, sequenceByMatchId[m.id])}
                prediction={predictions[m.id]}
                pickCounts={pickCounts?.[m.id]}
                onClick={() => onMatch(m.id)}
              />
            ))}
          </div>
        )}

        {done.length > 0 && (
          <div className="section">
            <div className="section-title">✅ Completed</div>
            {done.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                displayLabel={buildDisplayLabel(m, sequenceByMatchId[m.id])}
                prediction={predictions[m.id]}
                onClick={() => onMatch(m.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
