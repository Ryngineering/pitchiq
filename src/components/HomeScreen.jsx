import React, { useState, useRef, useEffect } from "react";
import MatchCard from "./MatchCard";
import { Settings, ChevronUp } from "lucide-react";

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
  onSettings,
  pickCounts,
  streak,
}) {
  const [filter, setFilter] = useState("all");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showPointsEducation, setShowPointsEducation] = useState(true);
  const screenRef = useRef(null);

  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const done = matches.filter((m) => m.status === "completed");

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    screenRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showLive = filter === "all" || filter === "live";
  const showUpcoming = filter === "all" || filter === "upcoming";
  const showDone = filter === "all" || filter === "done";

  const sequenceByMatchId = React.useMemo(() => {
    const ordered = [...matches].sort(byMatchStartThenId);
    const next = {};
    ordered.forEach((match, idx) => {
      next[match.id] = idx + 1;
    });
    return next;
  }, [matches]);

  return (
    <div className="screen" ref={screenRef}>
      {showPointsEducation && (
        <div className="points-education-modal">
          <div className="points-education-header">
            <h2>How Points Work 📊</h2>
            <button
              className="points-education-close"
              onClick={() => setShowPointsEducation(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="points-education-content">
            <div className="education-item">
              <span className="education-icon">⚡</span>
              <div>
                <strong>Points = Your Accuracy</strong>
                <p>
                  If you predict with 75% confidence and win, you get 7 points.
                </p>
              </div>
            </div>
            <div className="education-item">
              <span className="education-icon">🔄</span>
              <div>
                <strong>Change anytime</strong>
                <p>
                  You can change your prediction before the match starts. Points
                  recalculate based on your new probability.
                </p>
              </div>
            </div>
            <div className="education-item">
              <span className="education-icon">🎯</span>
              <div>
                <strong>More accurate = More points</strong>
                <p>
                  Higher confidence in correct predictions = higher points.
                  Learn more in your Profile.
                </p>
              </div>
            </div>
          </div>
          <button
            className="points-education-btn"
            onClick={() => setShowPointsEducation(false)}
          >
            Got it!
          </button>
        </div>
      )}
      <div className="header">
        <span className="header-logo">🏏 PITCHIQ</span>
        <div className="header-right">
          {streak >= 3 && (
            <span className="streak-chip">🔥 {streak} in a row</span>
          )}
          <span className="pts-chip">⚡ {myPoints} PTS</span>
          <button className="settings-btn" onClick={onSettings}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="home-filter-bar">
        {[
          { key: "all", label: "ALL" },
          { key: "live", label: "🟢 LIVE", count: live.length },
          { key: "upcoming", label: "⏳ UPCOMING", count: upcoming.length },
          { key: "done", label: "✅ DONE", count: done.length },
        ].map((f) => (
          <button
            key={f.key}
            className={`home-filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.count != null && f.count > 0 && (
              <span className="filter-count">{f.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="screen-pad">
        {showLive && live.length > 0 && (
          <div className="section home-section">
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

        {showUpcoming && upcoming.length > 0 && (
          <div className="section home-section">
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

        {showDone && done.length > 0 && (
          <div className="section home-section">
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

      <button
        className={`scroll-top-fab ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ChevronUp size={22} />
      </button>
    </div>
  );
}
