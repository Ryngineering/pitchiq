import React from "react";
import MatchCard from "./MatchCard";
import { Bell } from "lucide-react";

export default function HomeScreen({
  matches,
  predictions,
  onMatch,
  myPoints,
  onBell,
}) {
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const done = matches.filter((m) => m.status === "completed");

  return (
    <div className="screen">
      <div className="header">
        <span className="header-logo">🏏 PITCHIQ</span>
        <div className="header-right">
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
                prediction={predictions[m.id]}
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
                prediction={predictions[m.id]}
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
