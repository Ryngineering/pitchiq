import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { fetchLeaderboard } from "../lib/supabase";

const LEADERBOARD_SNAPSHOT_KEY = "pitchiq-leaderboard-ranks-v1";

function readRankSnapshot() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_SNAPSHOT_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRankSnapshot(rows) {
  const snapshot = rows.reduce((acc, row) => {
    acc[row.id] = row.rank;
    return acc;
  }, {});

  localStorage.setItem(LEADERBOARD_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

function getRankDelta(currentRank, previousRank) {
  return Number.isFinite(previousRank) ? previousRank - currentRank : 0;
}

function getRankMovement(delta) {
  if (delta > 0) {
    return { label: `↑${delta}`, tone: "up" };
  }

  if (delta < 0) {
    return { label: `↓${Math.abs(delta)}`, tone: "down" };
  }

  return { label: "→0", tone: "flat" };
}

function getAccuracyLabel(row) {
  if (!row.total) {
    return "No matches settled yet";
  }

  return `${row.correct}/${row.total} correct · ${Math.round((row.correct / row.total) * 100)}% accuracy`;
}

function getSeasonNarrative(totalMatches, settledMatches, remainingMatches) {
  if (!totalMatches) {
    return "Season schedule syncing now — standings will fill in as soon as the first fixtures land.";
  }

  if (!settledMatches) {
    return "Season just kicked off — predictions for Match 1 open now.";
  }

  if (!remainingMatches) {
    return "Season complete — final standings are locked in.";
  }

  return `${remainingMatches} match${remainingMatches !== 1 ? "es" : ""} left in the season — every settled result can still move this table.`;
}

export default function LeaderboardScreen({
  currentUserId,
  matches = [],
  onSettings,
}) {
  const [rows, setRows] = useState([]);
  const [rankChanges, setRankChanges] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchLeaderboard(currentUserId).then((data) => {
      if (cancelled) {
        return;
      }

      const previousRanks = readRankSnapshot();
      const nextRankChanges = data.reduce((acc, row) => {
        acc[row.id] = getRankDelta(row.rank, previousRanks[row.id]);
        return acc;
      }, {});

      setRows(data);
      setRankChanges(nextRankChanges);
      writeRankSnapshot(data);
      setLoading(false);
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
  const totalMatches = matches.length;
  const settledMatches = matches.filter(
    (match) => match.status === "completed",
  ).length;
  const remainingMatches = Math.max(totalMatches - settledMatches, 0);
  const seasonNarrative = getSeasonNarrative(
    totalMatches,
    settledMatches,
    remainingMatches,
  );

  return (
    <div className="screen">
      <div className="header">
        <span className="header-logo">🏏 PITCHIQ</span>
        <button
          className="settings-btn"
          aria-label="Settings"
          onClick={onSettings}
        >
          <Settings size={16} />
        </button>
      </div>
      <div className="screen-pad">
        <div className="lb-header">
          <div className="lb-header-title">Leaderboard</div>
          <div className="lb-header-sub">
            {loading
              ? "Loading…"
              : `${rows.length} player${rows.length !== 1 ? "s" : ""} competing · ${remainingMatches} match${remainingMatches !== 1 ? "es" : ""} left`}
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
                <div className="lb-rank-wrap">
                  <span className="lb-rank">{p.rank}</span>
                  <span
                    className={`lb-rank-move ${getRankMovement(rankChanges[p.id]).tone}`}
                  >
                    {getRankMovement(rankChanges[p.id]).label}
                  </span>
                </div>
                <div className={`lb-av ${p.isMe ? "me" : ""}`}>{p.av}</div>
                <div className="lb-info">
                  <div className="lb-name">
                    {p.name} {p.isMe ? "← You" : ""}
                  </div>
                  <div className="lb-stat">{getAccuracyLabel(p)}</div>
                </div>
                <span className="lb-pts">{p.pts}</span>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="lb-empty">
                <div className="lb-empty-title">No standings yet</div>
                <div className="lb-empty-copy">
                  {totalMatches
                    ? "Season just kicked off — predictions for Match 1 open now. Once players lock in picks, the table starts moving."
                    : "Fixtures are still syncing in. As soon as the first match opens, the leaderboard will have something to say."}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && (
          <div className="lb-context">
            <div className="lb-context-title">How this leaderboard moves</div>
            <div className="lb-context-copy">{seasonNarrative}</div>
            <div className="lb-context-grid">
              <div className="lb-context-card">
                <div className="lb-context-label">Scoring</div>
                <div className="lb-context-value">
                  Correct underdog calls pay more. A right 50% pick earns 5 pts;
                  a right 90% pick earns 1 pt.
                </div>
              </div>
              <div className="lb-context-card">
                <div className="lb-context-label">Updates</div>
                <div className="lb-context-value">
                  Ranks shift when a match result settles and points are
                  recalculated.
                </div>
              </div>
              <div className="lb-context-card">
                <div className="lb-context-label">Season Runway</div>
                <div className="lb-context-value">
                  {totalMatches
                    ? `${remainingMatches} of ${totalMatches} matches remain in the season.`
                    : "Match count will appear here once the schedule sync finishes."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
