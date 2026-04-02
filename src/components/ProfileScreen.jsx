import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { approveUser, fetchPendingUsers } from "../lib/supabase";

function getInitials(name) {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "U";
  return parts.map((part) => part[0].toUpperCase()).join("");
}

export default function ProfileScreen({
  user,
  isGuestMode = false,
  onSignIn,
  onRequireSignIn,
  onLogout,
  onNavigate,
  predictions,
  myPoints,
}) {
  const [adminError, setAdminError] = useState(null);
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPointsGuide, setShowPointsGuide] = useState(false);
  const settingsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showSettings) return undefined;
    const handleClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettings]);
  const [isLoadingPendingUsers, setIsLoadingPendingUsers] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const avatarInitials = getInitials(user.name || user.initials);

  // Derive history from live predictions map passed from App
  const history = Object.values(predictions ?? {}).filter(
    (p) => p.result === "won" || p.result === "lost" || p.result === "void",
  );

  const correct = history.filter((p) => p.result === "won").length;
  const total = history.filter((p) => p.result !== "void").length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  useEffect(() => {
    if (isGuestMode || !user.isAdmin) {
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
  }, [isGuestMode, user.id, user.isAdmin]);

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
        <div className="settings-wrap" ref={settingsRef}>
          <button
            className="settings-btn"
            aria-label="Settings"
            onClick={() => setShowSettings((v) => !v)}
          >
            <Settings size={16} />
          </button>
          {showSettings && (
            <div className="settings-dropdown">
              <button
                className="settings-item"
                onClick={() => {
                  setShowSettings(false);
                  if (isGuestMode) {
                    onSignIn?.();
                    return;
                  }
                  onLogout();
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {isGuestMode ? "Sign in" : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="screen-pad">
        {isGuestMode && (
          <div className="guest-profile-lock">
            Guest mode: profile features are read-only. Sign in to unlock picks,
            points, and history sync.
          </div>
        )}
        <div className="profile-hero">
          <div className="profile-av">{avatarInitials}</div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-email">{user.email}</div>
          {myPoints > 0 ? (
            <div className="profile-rank">⚡ {myPoints} pts</div>
          ) : (
            <button
              className={`profile-cta-btn ${isGuestMode ? "disabled" : ""}`}
              onClick={() => {
                if (isGuestMode) {
                  onRequireSignIn?.("predict");
                  return;
                }
                onNavigate("home");
              }}
              disabled={isGuestMode}
            >
              {isGuestMode
                ? "Sign in to make your first prediction"
                : "Make your first prediction →"}
            </button>
          )}
          <div className="profile-sub profile-sub-google">
            {user.provider === "google" ? (
              <>
                Signed in with{" "}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </>
            ) : (
              <>Signed in with {user.provider}</>
            )}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{myPoints}</div>
            <div className="stat-lbl">Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">
              {total > 0 ? (
                `${correct}/${total}`
              ) : (
                <span className="stat-val-muted">0</span>
              )}
            </div>
            <div className="stat-lbl">Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">
              {total > 0 ? (
                `${accuracy}%`
              ) : (
                <span className="stat-val-muted">0%</span>
              )}
            </div>
            <div className="stat-lbl">Accuracy</div>
          </div>
        </div>

        <div className="points-guide-card">
          <button
            className="points-guide-toggle"
            onClick={() => setShowPointsGuide(!showPointsGuide)}
          >
            <span style={{ fontSize: 18 }}>📚</span>
            <span className="points-guide-title">How Points Calculate</span>
            <span
              className={`points-guide-chevron ${showPointsGuide ? "open" : ""}`}
            >
              ›
            </span>
          </button>
          {showPointsGuide && (
            <div className="points-guide-content">
              <div className="guide-rule">
                <strong>The idea</strong>
                <p>
                  Harder calls are worth more. Easy favorite picks are worth
                  less.
                </p>
              </div>
              <div className="guide-rule">
                <strong>Quick example</strong>
                <p>
                  Back a team with only <strong>30%</strong> win chance and get
                  it right: about <strong>7 points</strong>. Back a team with
                  <strong> 80%</strong> win chance and get it right: about
                  <strong> 2 points</strong>.
                </p>
              </div>
              <div className="guide-rule">
                <strong>Change anytime</strong>
                <p>
                  You can <strong>change your prediction anytime</strong> before
                  the match starts. We always score your latest prediction.
                </p>
              </div>
              <div className="guide-rule">
                <strong>If you miss the pick</strong>
                <p>You get 0 points. Only winning predictions earn points.</p>
              </div>
            </div>
          )}
        </div>

        <div className="section profile-section" style={{ marginBottom: 12 }}>
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
                <div className="hist-match">Match {i + 1}</div>
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

        {user.isAdmin && !isGuestMode && (
          <>
            <div
              className="section profile-section"
              style={{ marginBottom: 12 }}
            >
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
