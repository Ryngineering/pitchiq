import { useCallback, useEffect, useRef, useState } from "react";
import { calcPts } from "./data";
import Toast from "./components/Toast";
import HomeScreen from "./components/HomeScreen";
import LoginScreen from "./components/LoginScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import ProfileScreen from "./components/ProfileScreen";
import MatchDetail from "./components/MatchDetail";
import BottomNav from "./components/BottomNav";
import {
  buildTeamLookup,
  consumeAuthIntent,
  fetchLeaderboard,
  fetchMyPredictions,
  getAuthenticatedUser,
  hasSupabaseConfig,
  loadAndCacheCricketTeams,
  signInWithGoogle,
  signOut,
  supabase,
  mapAuthUser,
  mapDbMatchToFrontend,
  upsertPrediction,
  refreshUserProfile,
} from "./lib/supabase";
import "./App.css";

const INACTIVITY_SIGN_OUT_MS = 15 * 60 * 1000;

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(hasSupabaseConfig);
  const [screen, setScreen] = useState("home");
  const [matches, setMatches] = useState([]);
  const [teamLookup, setTeamLookup] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [myPoints, setMyPoints] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const inactivityTimeoutRef = useRef(null);
  const autoSignOutRef = useRef(false);
  const signOutInProgressRef = useRef(false);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      window.clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

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

      clearInactivityTimer();
    };
  }, [clearInactivityTimer]);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let ignore = false;
    const AUTH_BOOTSTRAP_TIMEOUT_MS = 8000;

    const withTimeout = (promise, timeoutMs) =>
      Promise.race([
        promise,
        new Promise((_, reject) => {
          window.setTimeout(() => {
            reject(new Error("Auth bootstrap timeout"));
          }, timeoutMs);
        }),
      ]);

    const restoreSession = async () => {
      try {
        const authenticatedUser = await withTimeout(
          getAuthenticatedUser(),
          AUTH_BOOTSTRAP_TIMEOUT_MS,
        );

        if (ignore) {
          return;
        }

        setUser(authenticatedUser);
      } catch {
        if (ignore) {
          return;
        }

        setUser(null);
      } finally {
        if (!ignore) {
          setIsAuthLoading(false);
        }
      }
    };

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (ignore) {
        return;
      }

      if (event === "SIGNED_OUT") {
        const wasAutoSignOut = autoSignOutRef.current;
        autoSignOutRef.current = false;
        signOutInProgressRef.current = false;
        clearInactivityTimer();

        console.log("User signed out from authStateChange event");
        setUser(null);
        setSelectedId(null);
        setIsAuthLoading(false);
        setScreen("home");
        showToast(
          wasAutoSignOut
            ? "Signed out after 30 minutes of inactivity."
            : "Signed out successfully.",
          wasAutoSignOut ? "⏳" : "👋",
        );
        return; // return early since we don't need to fetch the user on sign out
      }

      let nextUser = null;

      try {
        if (session?.user) {
          nextUser = mapAuthUser(session.user); // Use session directly — no extra call needed
        }
        setUser(nextUser);
      } catch {
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }

      if (event === "SIGNED_IN" && nextUser) {
        // Refresh display_name / avatar from latest Google metadata (UPDATE only — no insert)
        refreshUserProfile(nextUser);

        if (consumeAuthIntent()) {
          setScreen("home");
          showToast(`Welcome ${nextUser.name}!`, "👋");
        }
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [clearInactivityTimer, showToast]);

  useEffect(() => {
    if (!user || !supabase) {
      clearInactivityTimer();
      return undefined;
    }

    const scheduleAutoSignOut = () => {
      clearInactivityTimer();
      inactivityTimeoutRef.current = window.setTimeout(async () => {
        if (signOutInProgressRef.current) {
          return;
        }

        signOutInProgressRef.current = true;
        autoSignOutRef.current = true;

        try {
          await signOut();
        } catch {
          autoSignOutRef.current = false;
          signOutInProgressRef.current = false;
          showToast(
            "Unable to sign out automatically. Please try again.",
            "⚠️",
          );
        }
      }, INACTIVITY_SIGN_OUT_MS);
    };

    const handleUserActivity = () => {
      scheduleAutoSignOut();
    };

    const activityEvents = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
      "visibilitychange",
      "focus",
    ];

    scheduleAutoSignOut();

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      clearInactivityTimer();
    };
  }, [user, clearInactivityTimer, showToast]);

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

  useEffect(() => {
    if (!user || !supabase) {
      return undefined;
    }

    let isCancelled = false;

    const bootstrapTeams = async () => {
      try {
        const teams = await loadAndCacheCricketTeams();
        if (!isCancelled) {
          setTeamLookup(buildTeamLookup(teams));
        }
      } catch {
        if (!isCancelled) {
          showToast("Unable to load team metadata.", "⚠️");
        }
      }
    };

    bootstrapTeams();

    return () => {
      isCancelled = true;
    };
  }, [user, showToast]);

  useEffect(() => {
    if (!user || !supabase) {
      return undefined;
    }

    let isCancelled = false;

    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from("cricket_matches")
        .select("*")
        .order("last_updated", { ascending: false });

      if (error) {
        showToast("Unable to load matches right now.", "⚠️");
        return;
      }

      if (isCancelled) {
        return;
      }

      setMatches(
        (data ?? []).map((row) => mapDbMatchToFrontend(row, teamLookup)),
      );
    };

    fetchMatches();

    const channel = supabase
      .channel("cricket-matches")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cricket_matches",
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            return;
          }

          const mapped = mapDbMatchToFrontend(payload.new, teamLookup);
          setMatches((prev) => {
            const existingIndex = prev.findIndex((m) => m.id === mapped.id);
            if (existingIndex === -1) {
              return [mapped, ...prev];
            }

            const next = [...prev];
            next[existingIndex] = mapped;
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, showToast, teamLookup]);

  // Load predictions from DB when user + teamLookup are ready
  useEffect(() => {
    if (!user || !supabase) return undefined;

    let isCancelled = false;

    const bootstrap = async () => {
      const rows = await fetchMyPredictions(user.id);
      if (isCancelled) return;

      const map = {};
      for (const r of rows) {
        map[r.matchId] = {
          matchId: r.matchId,
          team: r.picked,
          prob: r.prob,
          result: r.result,
          pts: r.pts ?? calcPts(r.prob),
          confirmed: r.result !== "pending",
        };
      }
      setPredictions(map);
    };

    bootstrap();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Load myPoints from leaderboard view
  useEffect(() => {
    if (!user || !supabase) return undefined;

    let isCancelled = false;

    const loadPoints = async () => {
      const rows = await fetchLeaderboard(user.id);
      if (isCancelled) return;
      const me = rows.find((r) => r.isMe);
      if (me) setMyPoints(me.pts);
    };

    loadPoints();
    return () => {
      isCancelled = true;
    };
  }, [user]);

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

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      const message =
        typeof error?.message === "string" && error.message.length > 0
          ? error.message
          : "Google SSO could not be started. Check Supabase Auth settings.";

      showToast(message, "⚠️");
    }
  };

  const handleLogout = async () => {
    try {
      autoSignOutRef.current = false;
      signOutInProgressRef.current = true;
      console.log("Signing out...");
      await signOut();
      console.log("Signed out successfully.");
    } catch {
      signOutInProgressRef.current = false;
      showToast("Unable to sign out right now. Please try again.", "⚠️");
    }
  };

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
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {toast && <Toast msg={toast.msg} emoji={toast.emoji} />}

      {screen === "home" && (
        <HomeScreen
          matches={matches}
          predictions={predictions}
          myPoints={myPoints}
          onMatch={(id) => {
            setSelectedId(id);
            setScreen("match");
          }}
          onBell={() => {
            setScreen("profile");
          }}
        />
      )}
      {screen === "match" && selectedMatch && (
        <MatchDetail
          match={selectedMatch}
          prediction={predictions[selectedId]}
          onPredict={handlePredict}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "leaderboard" && (
        <LeaderboardScreen currentUserId={user.id} />
      )}
      {screen === "profile" && (
        <ProfileScreen
          user={user}
          onLogout={handleLogout}
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
