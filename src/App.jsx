import { useCallback, useEffect, useRef, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { calcPts } from "./data";
import Toast from "./components/Toast";
import HomeScreen from "./components/HomeScreen";
import LoginScreen from "./components/LoginScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import ProfileScreen from "./components/ProfileScreen";
import MatchDetail from "./components/MatchDetail";
import BottomNav from "./components/BottomNav";
import {
  hasSupabaseConfig,
  requestAiMatchHelp,
  upsertPrediction,
} from "./lib/supabase";
import usePitchData from "./hooks/usePitchData";
import useSupabaseAuth from "./hooks/useSupabaseAuth";
import "./App.css";

const INACTIVITY_SIGN_OUT_MS = 30 * 60 * 1000;
const AI_HELP_ENABLED = import.meta.env.VITE_AI_HELP_ENABLED !== "false";

function App() {
  const [screen, setScreen] = useState("home");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isRefreshingApproval, setIsRefreshingApproval] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg, emoji = "🏏") => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    setToast({ msg, emoji });
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      showToast("You are offline. Live updates are paused.", "📴");
    };

    const handleOnline = () => {
      setIsOffline(false);
      showToast("Back online. Syncing latest updates.", "🌐");
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [showToast]);

  const handleAuthError = useCallback(
    (message) => {
      showToast(message, "⚠️");
    },
    [showToast],
  );

  const handleSignedIn = useCallback(
    (nextUser) => {
      setScreen("home");
      showToast(`Welcome ${nextUser.name}!`, "👋");
    },
    [showToast],
  );

  const handleSignedOut = useCallback(
    (reason) => {
      setSelectedId(null);
      setScreen("home");
      showToast(
        reason === "inactivity"
          ? "Signed out after 30 minutes of inactivity."
          : "Signed out successfully.",
        reason === "inactivity" ? "⏳" : "👋",
      );
    },
    [showToast],
  );

  const { isAuthLoading, login, logout, refreshApprovalStatus, user } =
    useSupabaseAuth({
      onError: handleAuthError,
      onSignedIn: handleSignedIn,
      onSignedOut: handleSignedOut,
    });

  const approvedUser = user?.isApproved ? user : null;

  const { matches, myPoints, predictions, setPredictions, pickCounts, streak } =
    usePitchData({
      onError: handleAuthError,
      user: approvedUser,
    });

  const handleIdle = useCallback(() => {
    if (!user) {
      return;
    }

    void logout({ reason: "inactivity" });
  }, [logout, user]);

  const { pause, start } = useIdleTimer({
    crossTab: true,
    events: [
      "mousemove",
      "keydown",
      "wheel",
      "mousedown",
      "touchstart",
      "touchmove",
      "focus",
    ],
    name: "pitchiq-session-timeout",
    onIdle: handleIdle,
    startOnMount: false,
    syncTimers: 200,
    timeout: INACTIVITY_SIGN_OUT_MS,
  });

  useEffect(() => {
    if (user) {
      start();
      return;
    }

    pause();
  }, [pause, start, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDescription = params.get("error_description");

    if (!errorDescription) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      showToast(errorDescription, "⚠️");
    }, 0);

    window.history.replaceState({}, document.title, window.location.pathname);

    return () => window.clearTimeout(timeoutId);
  }, [showToast]);

  const handlePredict = async (matchId, team, prob, pickedTeamId) => {
    // Optimistic update so UI feels instant
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        team,
        prob,
        result: "pending",
        pts: calcPts(prob),
        confirmed: false,
      },
    }));

    showToast(
      `Locked in! ${team} to win · ${calcPts(prob)} pts if correct`,
      "🔐",
    );

    if (user && pickedTeamId) {
      const { error } = await upsertPrediction({
        userId: user.id,
        matchId,
        pickedTeamId,
        probabilityAtPick: prob,
      });
      if (error) {
        showToast("Prediction saved locally only — sync failed.", "⚠️");
      }
    }
  };

  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  const handleRefreshApproval = useCallback(async () => {
    setIsRefreshingApproval(true);

    try {
      const flags = await refreshApprovalStatus();

      if (flags?.isApproved) {
        showToast("Approval confirmed. Welcome in.", "✅");
        return;
      }

      showToast("Still waiting for approval.", "⏳");
    } finally {
      setIsRefreshingApproval(false);
    }
  }, [refreshApprovalStatus, showToast]);

  const handleRequestAiHelp = useCallback(
    async ({ matchId, mode }) => {
      const activeMatch = matches.find((m) => m.id === matchId);

      const { data, error } = await requestAiMatchHelp({ matchId, mode });

      if (error) {
        const status = error?.context?.status ?? error?.status;
        if (status === 409) {
          showToast("AI Help already used for this match.", "🧠");
          const alreadyUsedError = new Error(
            "AI Help already used for this match.",
          );
          alreadyUsedError.code = "AI_HELP_ALREADY_USED";
          throw alreadyUsedError;
        }

        if (status === 401) {
          showToast("Session expired. Please sign in again.", "🔐");
          const authError = new Error("Session expired. Please sign in again.");
          authError.code = "AI_HELP_UNAUTHORIZED";
          throw authError;
        }

        showToast("AI Coach is unavailable right now.", "⚠️");
        throw new Error(error.message || "Unable to fetch AI guidance.");
      }

      const raw = data?.payload ?? data ?? {};
      const team1Prob = Number(activeMatch?.t1p ?? 50);
      const recommendTeam1 = team1Prob >= 50;
      const fallbackTeam = recommendTeam1
        ? {
            id: activeMatch?.t1TeamId,
            abbreviation: activeMatch?.t1,
            name: activeMatch?.t1Name,
          }
        : {
            id: activeMatch?.t2TeamId,
            abbreviation: activeMatch?.t2,
            name: activeMatch?.t2Name,
          };

      const normalized = {
        mode,
        confidence: Number(
          raw.confidence ?? (recommendTeam1 ? team1Prob : 100 - team1Prob),
        ),
        headline: raw.headline || raw.summary || "AI guidance is ready",
        recommendedTeam:
          raw.recommendedTeam || raw.recommended_team || fallbackTeam,
        insights: Array.isArray(raw.insights)
          ? raw.insights
          : Array.isArray(raw.bullets)
            ? raw.bullets
            : [],
        riskWarning:
          raw.riskWarning ||
          raw.risk_warning ||
          "Cricket momentum can shift rapidly in a short span.",
        invalidationConditions: Array.isArray(raw.invalidationConditions)
          ? raw.invalidationConditions
          : Array.isArray(raw.invalidation_conditions)
            ? raw.invalidation_conditions
            : [],
        sources: Array.isArray(raw.sources) ? raw.sources : [],
      };

      showToast("AI Coach insights are ready.", "🧠");
      return normalized;
    },
    [matches, showToast],
  );

  const selectedMatch = matches.find((m) => m.id === selectedId);

  if (!hasSupabaseConfig) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0f0f1e",
          color: "white",
          textAlign: "center",
          flexDirection: "column",
          gap: "20px",
          padding: "24px",
        }}
      >
        <h2>⚠️ Supabase configuration missing</h2>
        <p>
          Add your Supabase project settings to .env.local before starting the
          app.
        </p>
        <code
          style={{
            background: "#1a1a2e",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
          }}
        >
          {`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_publishable_or_anon_key\nVITE_SUPABASE_REDIRECT_URL=http://localhost:5173`}
        </code>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="app">
        {isOffline && (
          <div className="offline-banner">
            Offline mode: live data may be stale.
          </div>
        )}
        <div className="login-screen">
          <div className="login-logo-wrap">
            <span className="login-ball">🏏</span>
            <div className="login-logo">PITCHIQ</div>
          </div>
          <div className="login-tagline">Restoring your session…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {isOffline && (
          <div className="offline-banner">
            Offline mode: sign-in requires internet.
          </div>
        )}
        <LoginScreen onLogin={login} />
      </>
    );
  }

  if (!user.isApproved) {
    return (
      <div className="app">
        {isOffline && (
          <div className="offline-banner">
            Offline mode: approval checks require internet.
          </div>
        )}
        {toast && <Toast msg={toast.msg} emoji={toast.emoji} />}

        <div className="login-screen">
          <div className="login-glow" />
          <div className="login-glow2" />

          <div className="login-logo-wrap">
            <span className="login-ball">🏏</span>
            <div className="login-logo">PITCHIQ</div>
          </div>

          <div className="login-tagline">Approval Required</div>
          <div className="login-headline">
            Hi <span>{user.name}</span>
          </div>
          <div className="login-desc" style={{ maxWidth: 320 }}>
            Your account is signed in but still waiting for admin approval. Once
            approved, tap refresh and the app will open immediately.
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: 300,
              display: "grid",
              gap: 12,
            }}
          >
            <button
              className="confirm-btn"
              disabled={isRefreshingApproval}
              onClick={() => {
                void handleRefreshApproval();
              }}
            >
              {isRefreshingApproval
                ? "Checking approval..."
                : "Refresh approval"}
            </button>
            <button className="profile-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {isOffline && (
        <div className="offline-banner">
          Offline mode: live data may be stale.
        </div>
      )}
      {toast && <Toast msg={toast.msg} emoji={toast.emoji} />}

      {screen === "home" && (
        <HomeScreen
          matches={matches}
          predictions={predictions}
          myPoints={myPoints}
          pickCounts={pickCounts}
          streak={streak}
          onMatch={(id) => {
            setSelectedId(id);
            setScreen("match");
          }}
          onSettings={() => {
            setScreen("profile");
          }}
        />
      )}
      {screen === "match" && selectedMatch && (
        <MatchDetail
          match={selectedMatch}
          currentUserId={user.id}
          prediction={predictions[selectedId]}
          onPredict={handlePredict}
          aiHelpEnabled={AI_HELP_ENABLED}
          onRequestAiHelp={handleRequestAiHelp}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "leaderboard" && (
        <LeaderboardScreen
          currentUserId={user.id}
          matches={matches}
          onSettings={() => setScreen("profile")}
        />
      )}
      {screen === "profile" && (
        <ProfileScreen
          user={user}
          onLogout={handleLogout}
          onNavigate={(s) => setScreen(s)}
          predictions={predictions}
          myPoints={myPoints}
        />
      )}

      <BottomNav
        active={screen === "match" ? "home" : screen}
        onChange={(s) => setScreen(s)}
      />
    </div>
  );
}

export default App;
