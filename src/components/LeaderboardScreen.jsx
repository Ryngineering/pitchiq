import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../lib/supabase";

export default function LeaderboardScreen({ currentUserId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard(currentUserId).then((data) => {
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  // Podium: show rank 2, 1, 3 for visual layout — requires at least 3 rows
  const byRank = [...rows].sort((a, b) => a.rank - b.rank);
  const top3 = byRank.length >= 3 ? [byRank[1], byRank[0], byRank[2]] : byRank;
  const podiumStyles = ["r2", "r1", "r3"];
  const baseStyles = ["b2", "b1", "b3"];
  const crowns = [null, "👑", null];
  const rankNums = [2, 1, 3];

  return (
    <div className="screen">
      <div className="header">
        <span className="header-logo">🏏 PITCHIQ</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
          Leaderboard
        </span>
      </div>
      <div className="screen-pad">
        <div className="lb-header">
          <div className="lb-header-title">Leaderboard</div>
          <div className="lb-header-sub">
            {loading
              ? "Loading…"
              : `${rows.length} player${rows.length !== 1 ? "s" : ""} competing · Updated live`}
          </div>
        </div>

        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              color: "var(--muted)",
              fontWeight: 700,
            }}
          >
            Loading…
          </div>
        )}

        {!loading && top3.length >= 3 && (
          <div className="podium">
            {top3.map((p, i) => (
              <div key={p.id} className="podium-item">
                {crowns[i] && <span className="podium-crown">{crowns[i]}</span>}
                <div
                  className={`podium-avatar ${podiumStyles[i]} ${p.isMe ? "me" : ""}`}
                >
                  {p.av}
                </div>
                <span className="podium-name">
                  {p.name}
                  {p.isMe ? " 👈" : ""}
                </span>
                <span className="podium-pts">{p.pts} pts</span>
                <div className={`podium-base ${baseStyles[i]}`}>
                  <span className="podium-rank">{rankNums[i]}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="lb-list">
            {byRank.map((p) => (
              <div key={p.id} className={`lb-row ${p.isMe ? "me" : ""}`}>
                <span className="lb-rank">{p.rank}</span>
                <div className={`lb-av ${p.isMe ? "me" : ""}`}>{p.av}</div>
                <div className="lb-info">
                  <div className="lb-name">
                    {p.name} {p.isMe ? "← You" : ""}
                  </div>
                  <div className="lb-stat">
                    {p.correct}/{p.total} correct ·{" "}
                    {p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0}%
                    accuracy
                  </div>
                </div>
                <span className="lb-pts">{p.pts}</span>
              </div>
            ))}
            {rows.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "var(--muted)",
                  fontWeight: 700,
                }}
              >
                No predictions made yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
