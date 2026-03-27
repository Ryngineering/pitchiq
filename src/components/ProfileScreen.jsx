export default function ProfileScreen({
  user,
  onLogout,
  predictions,
  myPoints,
}) {
  // Derive history from live predictions map passed from App
  const history = Object.values(predictions ?? {}).filter(
    (p) => p.result === "won" || p.result === "lost" || p.result === "void",
  );

  const correct = history.filter((p) => p.result === "won").length;
  const total = history.filter((p) => p.result !== "void").length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="screen">
      <div className="header">
        <span className="header-logo">🏏 PITCHIQ</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
          My Profile
        </span>
      </div>
      <div className="screen-pad">
        <div className="profile-hero">
          <div className="profile-av">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="profile-av-img"
              />
            ) : (
              user.initials
            )}
          </div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-email">{user.email}</div>
          <div className="profile-rank">
            {myPoints > 0 ? `⚡ ${myPoints} pts` : "No predictions yet"}
          </div>
          <div className="profile-sub">
            Authenticated via{" "}
            {user.provider === "google" ? "Google SSO" : user.provider}
          </div>
          <div className="profile-actions">
            <button className="profile-btn" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{myPoints}</div>
            <div className="stat-lbl">Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">
              {total > 0 ? `${correct}/${total}` : "—"}
            </div>
            <div className="stat-lbl">Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">{total > 0 ? `${accuracy}%` : "—"}</div>
            <div className="stat-lbl">Accuracy</div>
          </div>
        </div>

        <div className="section" style={{ marginBottom: 12 }}>
          <div className="section-title">📋 Prediction History</div>
        </div>

        <div className="hist-list">
          {history.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "16px 0",
                color: "var(--muted)",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              No settled predictions yet.
            </div>
          )}
          {history.map((h, i) => (
            <div key={h.matchId ?? i} className="hist-item">
              <span className="hist-badge">{h.pickedEmoji ?? "🏏"}</span>
              <div className="hist-info">
                <div className="hist-match">Match # - {h.matchId}</div>
                <div className="hist-pick">
                  Picked {h.team} at {h.prob}% odds
                </div>
              </div>
              <div className="hist-right">
                <span className={`hist-pts ${h.result}`}>
                  {h.result === "won"
                    ? `+${h.pts}`
                    : h.result === "void"
                      ? "VOID"
                      : "—"}
                </span>
                <span className={`hist-tag ${h.result}`}>
                  {h.result === "won"
                    ? "WON ✓"
                    : h.result === "void"
                      ? "VOID"
                      : "LOST"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
