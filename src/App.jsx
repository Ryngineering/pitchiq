import { useCallback, useEffect, useRef, useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { calcPts } from "./data";
import Toast from "./components/Toast";
import HomeScreen from "./components/HomeScreen";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import ProfileScreen from "./components/ProfileScreen";
import MatchDetail from "./components/MatchDetail";
import BottomNav from "./components/BottomNav";
import {
  signInWithPhonePassword,
  submitPhoneRegistration,
  hasSupabaseConfig,
  requestAiMatchHelp,
  upsertPrediction,
} from "./lib/supabase";
import usePitchData from "./hooks/usePitchData";
import useSupabaseAuth from "./hooks/useSupabaseAuth";
import "./App.css";

const INACTIVITY_SIGN_OUT_MS = 30 * 60 * 1000;
const AI_HELP_ENABLED = import.meta.env.VITE_AI_HELP_ENABLED !== "false";

const GUEST_DEMO_MATCHES = [
  {
    id: 900001,
    t1: "MI",
    t2: "CSK",
    t1TeamId: 101,
    t2TeamId: 102,
    t1Name: "Mumbai Indians",
    t2Name: "Chennai Super Kings",
    t1Logo: null,
    t2Logo: null,
    t1Meta: {
      s: "MI",
      name: "Mumbai Indians",
      bg: "#004BA0",
      fg: "#FFFFFF",
      logo: null,
      em: "🦁",
    },
    t2Meta: {
      s: "CSK",
      name: "Chennai Super Kings",
      bg: "#FFC300",
      fg: "#111111",
      logo: null,
      em: "🦁",
    },
    label: "Demo Match",
    leagueName: "IPL Demo",
    startAtTs: Date.now() + 40 * 60 * 1000,
    date: "Today, 7:30 PM IST",
    venue: "Wankhede Stadium, Mumbai",
    status: "upcoming",
    winner: undefined,
    t1s: "—",
    t1o: "",
    t2s: "—",
    t2o: "",
    t1p: 56,
    statistics: [],
    homeInfoRaw: null,
    awayInfoRaw: null,
  },
  {
    id: 900002,
    t1: "RCB",
    t2: "KKR",
    t1TeamId: 103,
    t2TeamId: 104,
    t1Name: "Royal Challengers Bengaluru",
    t2Name: "Kolkata Knight Riders",
    t1Logo: null,
    t2Logo: null,
    t1Meta: {
      s: "RCB",
      name: "Royal Challengers Bengaluru",
      bg: "#D71920",
      fg: "#FFFFFF",
      logo: null,
      em: "🔥",
    },
    t2Meta: {
      s: "KKR",
      name: "Kolkata Knight Riders",
      bg: "#3A225D",
      fg: "#FFFFFF",
      logo: null,
      em: "💜",
    },
    label: "Demo Match",
    leagueName: "IPL Demo",
    startAtTs: Date.now() - 50 * 60 * 1000,
    date: "Live now",
    venue: "M Chinnaswamy Stadium, Bengaluru",
    status: "live",
    winner: undefined,
    t1s: "184/7",
    t1o: "20.0",
    t2s: "96/3",
    t2o: "11.2",
    t1p: 54,
    statistics: [
      {
        inningNumber: 1,
        team: {
          id: 103,
          abbreviation: "RCB",
          inningPartnerships: [
            {
              firstPlayer: { name: "Virat Kohli" },
              secondPlayer: { name: "Rajat Patidar" },
            },
          ],
          inningBatsmen: [
            {
              player: { name: "Virat Kohli" },
              runs: 43,
              balls: 29,
              battingStrikeRate: 148.28,
            },
            {
              player: { name: "Rajat Patidar" },
              runs: 24,
              balls: 17,
              battingStrikeRate: 141.17,
            },
            {
              player: { name: "Faf du Plessis" },
              runs: 16,
              balls: 12,
              battingStrikeRate: 133.33,
            },
            {
              player: { name: "Glenn Maxwell" },
              runs: 6,
              balls: 4,
              battingStrikeRate: 150,
            },
          ],
          fallOfWickets: [
            {
              dismissalBatsman: { name: "Faf du Plessis" },
            },
            {
              dismissalBatsman: { name: "Glenn Maxwell" },
            },
          ],
          inningBowlers: [
            {
              player: { name: "Mitchell Starc" },
              wickets: 1,
              concededRuns: 21,
              overs: 3.0,
              economy: 7.0,
            },
            {
              player: { name: "Sunil Narine" },
              wickets: 1,
              concededRuns: 18,
              overs: 3.4,
              economy: 4.91,
            },
            {
              player: { name: "Varun Chakaravarthy" },
              wickets: 0,
              concededRuns: 25,
              overs: 3.0,
              economy: 8.33,
            },
            {
              player: { name: "Andre Russell" },
              wickets: 0,
              concededRuns: 19,
              overs: 2.0,
              economy: 9.5,
            },
          ],
        },
      },
      {
        inningNumber: 2,
        team: {
          id: 104,
          abbreviation: "KKR",
          inningPartnerships: [
            {
              firstPlayer: { name: "Shreyas Iyer" },
              secondPlayer: { name: "Rinku Singh" },
            },
          ],
          inningBatsmen: [
            {
              player: { name: "Shreyas Iyer" },
              runs: 32,
              balls: 22,
              battingStrikeRate: 145.45,
            },
            {
              player: { name: "Rinku Singh" },
              runs: 19,
              balls: 14,
              battingStrikeRate: 135.71,
            },
            {
              player: { name: "Sunil Narine" },
              runs: 21,
              balls: 11,
              battingStrikeRate: 190.9,
            },
            {
              player: { name: "Venkatesh Iyer" },
              runs: 12,
              balls: 10,
              battingStrikeRate: 120,
            },
            {
              player: { name: "Andre Russell" },
              runs: 6,
              balls: 5,
              battingStrikeRate: 120,
            },
          ],
          fallOfWickets: [
            {
              dismissalBatsman: { name: "Sunil Narine" },
            },
            {
              dismissalBatsman: { name: "Venkatesh Iyer" },
            },
            {
              dismissalBatsman: { name: "Andre Russell" },
            },
          ],
          inningBowlers: [
            {
              player: { name: "Mohammed Siraj" },
              wickets: 1,
              concededRuns: 24,
              overs: 3.0,
              economy: 8.0,
            },
            {
              player: { name: "Karn Sharma" },
              wickets: 1,
              concededRuns: 20,
              overs: 2.2,
              economy: 8.57,
            },
            {
              player: { name: "Cameron Green" },
              wickets: 1,
              concededRuns: 17,
              overs: 2.0,
              economy: 8.5,
            },
          ],
        },
      },
    ],
    homeInfoRaw: "RCB 184/7",
    awayInfoRaw: "T:185",
    currentOver: "11.2",
  },
  {
    id: 900003,
    t1: "SRH",
    t2: "RR",
    t1TeamId: 105,
    t2TeamId: 106,
    t1Name: "Sunrisers Hyderabad",
    t2Name: "Rajasthan Royals",
    t1Logo: null,
    t2Logo: null,
    t1Meta: {
      s: "SRH",
      name: "Sunrisers Hyderabad",
      bg: "#F26B1D",
      fg: "#FFFFFF",
      logo: null,
      em: "🌅",
    },
    t2Meta: {
      s: "RR",
      name: "Rajasthan Royals",
      bg: "#EA1A85",
      fg: "#FFFFFF",
      logo: null,
      em: "👑",
    },
    label: "Demo Match",
    leagueName: "IPL Demo",
    startAtTs: Date.now() - 24 * 60 * 60 * 1000,
    date: "Yesterday",
    venue: "Rajiv Gandhi Intl Stadium, Hyderabad",
    status: "completed",
    winner: "RR",
    t1s: "171/8",
    t1o: "20.0",
    t2s: "172/6",
    t2o: "19.3",
    t1p: 48,
    statistics: [],
    homeInfoRaw: null,
    awayInfoRaw: null,
  },
];

const GUEST_DEMO_LEADERBOARD = [
  {
    id: "demo-1",
    name: "A. Sharma",
    av: "AS",
    pts: 42,
    correct: 8,
    total: 12,
    rank: 1,
    isMe: false,
  },
  {
    id: "demo-2",
    name: "R. Mehta",
    av: "RM",
    pts: 38,
    correct: 7,
    total: 12,
    rank: 2,
    isMe: false,
  },
  {
    id: "demo-3",
    name: "K. Iyer",
    av: "KI",
    pts: 35,
    correct: 7,
    total: 12,
    rank: 3,
    isMe: false,
  },
  {
    id: "demo-4",
    name: "P. Verma",
    av: "PV",
    pts: 31,
    correct: 6,
    total: 12,
    rank: 4,
    isMe: false,
  },
  {
    id: "demo-5",
    name: "S. Khan",
    av: "SK",
    pts: 28,
    correct: 5,
    total: 12,
    rank: 5,
    isMe: false,
  },
];

function App() {
  const [screen, setScreen] = useState("home");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [authScreen, setAuthScreen] = useState("login");
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
    const params = new URLSearchParams(window.location.search);
    const registerParam = params.get("register");
    const registerPath = window.location.pathname
      .toLowerCase()
      .includes("register");

    setAuthScreen(registerPath || registerParam === "1" ? "register" : "login");
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

  const {
    continueAsGuest,
    isAuthLoading,
    login,
    logout,
    refreshApprovalStatus,
    user,
  } = useSupabaseAuth({
    onError: handleAuthError,
    onSignedIn: handleSignedIn,
    onSignedOut: handleSignedOut,
  });

  const isGuestMode = Boolean(user?.isGuest);
  const approvedUser = user?.isApproved && !isGuestMode ? user : null;

  const { matches, myPoints, predictions, setPredictions, pickCounts, streak } =
    usePitchData({
      onError: handleAuthError,
      user: approvedUser,
    });

  const visibleMatches = isGuestMode ? GUEST_DEMO_MATCHES : matches;

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
    if (!user || isGuestMode) {
      showToast("You are in guest mode. Sign in to lock predictions.", "🔐");
      return;
    }

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
      if (!user || isGuestMode) {
        showToast("You are in guest mode. Sign in to use AI Coach.", "🔐");
        const guestError = new Error("Sign in required for AI Coach.");
        guestError.code = "AI_HELP_GUEST_MODE";
        throw guestError;
      }

      const activeMatch = visibleMatches.find((m) => m.id === matchId);

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
    [isGuestMode, showToast, user, visibleMatches],
  );

  const handleGuestAction = useCallback(
    (action) => {
      const label =
        action === "ai"
          ? "AI Coach"
          : action === "profile"
            ? "manage your profile"
            : "predict";
      showToast(`You are in guest mode. Sign in to ${label}.`, "🔐");
    },
    [showToast],
  );

  const handleGuestSignIn = useCallback(() => {
    void login();
  }, [login]);

  const handlePhoneSignIn = useCallback(async ({ phone, password }) => {
    await signInWithPhonePassword({ phone, password });
  }, []);

  const handlePhoneRegister = useCallback(
    async ({ phone, password, firstName, lastName, inviteCode }) => {
      const response = await submitPhoneRegistration({
        phone,
        password,
        firstName,
        lastName,
        inviteCode,
      });

      if (!response.error) {
        setAuthScreen("login");
        const nextUrl = `${window.location.pathname}`;
        window.history.replaceState({}, document.title, nextUrl);
        showToast(
          "Registration submitted. Sign in after admin approval.",
          "✅",
        );
      }

      return response;
    },
    [showToast],
  );

  const selectedMatch = visibleMatches.find((m) => m.id === selectedId);

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
        {authScreen === "register" ? (
          <RegisterScreen
            onRegister={handlePhoneRegister}
            onGoToSignIn={() => {
              setAuthScreen("login");
              const nextUrl = `${window.location.pathname}`;
              window.history.replaceState({}, document.title, nextUrl);
            }}
          />
        ) : (
          <LoginScreen
            onLogin={login}
            onContinueAsGuest={continueAsGuest}
            onPhoneSignIn={handlePhoneSignIn}
            onOpenRegister={() => {
              setAuthScreen("register");
              const nextUrl = `${window.location.pathname}?register=1`;
              window.history.replaceState({}, document.title, nextUrl);
            }}
          />
        )}
      </>
    );
  }

  if (!isGuestMode && !user.isApproved) {
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
      {isGuestMode && (
        <div className="guest-banner">
          <span>
            Guest mode: sign in to predict, use AI Coach, and sync data.
          </span>
          <button className="guest-banner-btn" onClick={handleGuestSignIn}>
            Sign in
          </button>
        </div>
      )}
      {toast && <Toast msg={toast.msg} emoji={toast.emoji} />}

      {screen === "home" && (
        <HomeScreen
          matches={visibleMatches}
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
          currentUserId={isGuestMode ? null : user.id}
          isGuestMode={isGuestMode}
          prediction={predictions[selectedId]}
          onPredict={handlePredict}
          aiHelpEnabled={AI_HELP_ENABLED}
          onRequestAiHelp={handleRequestAiHelp}
          onRequireSignIn={handleGuestAction}
          onBack={() => setScreen("home")}
          onSignOut={handleLogout}
          onSettings={() => setScreen("profile")}
        />
      )}
      {screen === "leaderboard" && (
        <LeaderboardScreen
          currentUserId={isGuestMode ? null : user.id}
          matches={visibleMatches}
          isGuestMode={isGuestMode}
          demoRows={GUEST_DEMO_LEADERBOARD}
          onSettings={() => setScreen("profile")}
        />
      )}
      {screen === "profile" && (
        <ProfileScreen
          user={user}
          isGuestMode={isGuestMode}
          onSignIn={handleGuestSignIn}
          onRequireSignIn={handleGuestAction}
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
