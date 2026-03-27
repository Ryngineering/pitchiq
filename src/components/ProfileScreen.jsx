import { useEffect, useState } from "react";
import { approveUser, fetchPendingUsers } from "../lib/supabase";

export default function ProfileScreen({
  user,
  onLogout,
  predictions,
  myPoints,
}) {
  const [adminError, setAdminError] = useState(null);
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [isLoadingPendingUsers, setIsLoadingPendingUsers] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);

  // Derive history from live predictions map passed from App
  const history = Object.values(predictions ?? {}).filter(
    (p) => p.result === "won" || p.result === "lost" || p.result === "void",
  );

  const correct = history.filter((p) => p.result === "won").length;
  const total = history.filter((p) => p.result !== "void").length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  useEffect(() => {
    if (!user.isAdmin) {
      setPendingUsers([]);
      setAdminError(null);
      return undefined;
    }

    let ignore = false;

    const loadPendingUsers = async () => {
      setIsLoadingPendingUsers(true);
      setAdminError(null);

      try {
        const nextPendingUsers = await fetchPendingUsers();

        if (!ignore) {
          setPendingUsers(
            nextPendingUsers.filter(
              (pendingUser) => pendingUser.id !== user.id,
            ),
          );
        }
      } catch {
        if (!ignore) {
          setAdminError("Unable to load pending users right now.");
        }
      } finally {
        if (!ignore) {
          setIsLoadingPendingUsers(false);
        }
      }
    };

    void loadPendingUsers();

    return () => {
      ignore = true;
    };
  }, [user.id, user.isAdmin]);

  const handleApprove = async (pendingUserId) => {
    if (!pendingUserId || approvingUserId) {
      return;
    }

    setApprovingUserId(pendingUserId);
    setAdminError(null);
    setPendingUsers((prevUsers) =>
      prevUsers.filter((pendingUser) => pendingUser.id !== pendingUserId),
    );

    try {
      const { error } = await approveUser(pendingUserId);

      if (error) {
        setAdminError("Approval failed. Please try again.");
        const nextPendingUsers = await fetchPendingUsers();
        setPendingUsers(
          nextPendingUsers.filter((pendingUser) => pendingUser.id !== user.id),
        );
        return;
      }

      const nextPendingUsers = await fetchPendingUsers();
      setPendingUsers(
        nextPendingUsers.filter((pendingUser) => pendingUser.id !== user.id),
      );
    } catch {
      setAdminError("Approval failed. Please try again.");
    } finally {
      setApprovingUserId(null);
    }
  };

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

        {user.isAdmin && (
          <>
            <div className="section" style={{ marginBottom: 12 }}>
              <div className="section-title">🛡️ Pending Approvals</div>
            </div>

            <div className="hist-list">
              {adminError && (
                <div
                  style={{
                    background: "rgba(255, 71, 87, 0.08)",
                    border: "1px solid rgba(255, 71, 87, 0.2)",
                    borderRadius: 14,
                    color: "var(--sub)",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 8,
                    padding: "14px 16px",
                  }}
                >
                  {adminError}
                </div>
              )}

              {isLoadingPendingUsers && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px 0",
                    color: "var(--muted)",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Loading pending users...
                </div>
              )}

              {!isLoadingPendingUsers && pendingUsers.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px 0 24px",
                    color: "var(--muted)",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  No pending users right now.
                </div>
              )}

              {pendingUsers.map((pendingUser) => (
                <div key={pendingUser.id} className="hist-item">
                  <span className="hist-badge">⏳</span>
                  <div className="hist-info">
                    <div className="hist-match">{pendingUser.name}</div>
                    <div className="hist-pick">{pendingUser.email}</div>
                  </div>
                  <div className="hist-right" style={{ minWidth: 108 }}>
                    <button
                      className="change-btn"
                      disabled={approvingUserId === pendingUser.id}
                      onClick={() => {
                        void handleApprove(pendingUser.id);
                      }}
                    >
                      {approvingUserId === pendingUser.id
                        ? "Approving..."
                        : "Approve"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
