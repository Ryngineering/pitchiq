import { useCallback, useEffect, useRef, useState } from "react";
import {
  consumeAuthIntent,
  fetchUserProfileFlags,
  getAuthenticatedUser,
  hasSupabaseConfig,
  mapAuthUser,
  refreshUserProfile,
  signInWithGoogle,
  signOut,
  supabase,
} from "../lib/supabase";

const AUTH_BOOTSTRAP_TIMEOUT_MS = 8000;

const GUEST_USER = {
  id: null,
  name: "Guest",
  email: "guest@local",
  avatarUrl: null,
  initials: "G",
  isAdmin: false,
  isApproved: true,
  isGuest: true,
  provider: "guest",
};

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Auth bootstrap timeout"));
      }, timeoutMs);
    }),
  ]);
}

export default function useSupabaseAuth({
  onError,
  onSignedIn,
  onSignedOut,
} = {}) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(hasSupabaseConfig);
  const onErrorRef = useRef(onError);
  const onSignedInRef = useRef(onSignedIn);
  const onSignedOutRef = useRef(onSignedOut);
  const signOutReasonRef = useRef("manual");
  const signOutInProgressRef = useRef(false);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onSignedInRef.current = onSignedIn;
  }, [onSignedIn]);

  useEffect(() => {
    onSignedOutRef.current = onSignedOut;
  }, [onSignedOut]);

  const emitError = useCallback((message) => {
    onErrorRef.current?.(message);
  }, []);

  const continueAsGuest = useCallback(() => {
    setUser(GUEST_USER);
    setIsAuthLoading(false);
  }, []);

  const hydrateUserWithProfileFlags = useCallback(async (nextUser) => {
    if (!nextUser?.id) {
      return null;
    }

    const flags = await fetchUserProfileFlags(nextUser.id);

    return {
      ...nextUser,
      ...flags,
    };
  }, []);

  const refreshApprovalStatus = useCallback(async () => {
    if (!user?.id) {
      return null;
    }

    const flags = await fetchUserProfileFlags(user.id);

    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      return {
        ...prevUser,
        ...flags,
      };
    });

    return flags;
  }, [user]);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let ignore = false;

    const restoreSession = async () => {
      try {
        const authenticatedUser = await withTimeout(
          getAuthenticatedUser(),
          AUTH_BOOTSTRAP_TIMEOUT_MS,
        );
        const hydratedUser = authenticatedUser
          ? await hydrateUserWithProfileFlags(authenticatedUser)
          : null;

        if (!ignore) {
          setUser(hydratedUser);
        }
      } catch {
        if (!ignore) {
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setIsAuthLoading(false);
        }
      }
    };

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (ignore) {
        return;
      }

      if (event === "SIGNED_OUT") {
        const reason = signOutReasonRef.current;

        signOutReasonRef.current = "manual";
        signOutInProgressRef.current = false;
        setUser(null);
        setIsAuthLoading(false);
        onSignedOutRef.current?.(reason);
        return;
      }

      void (async () => {
        let nextUser = null;

        try {
          if (session?.user) {
            const mappedUser = mapAuthUser(session.user);

            nextUser = await hydrateUserWithProfileFlags(mappedUser);
          }

          if (!ignore) {
            setUser(nextUser);
          }
        } catch {
          if (!ignore) {
            setUser(null);
          }
        } finally {
          if (!ignore) {
            setIsAuthLoading(false);
          }
        }

        if (
          (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
          nextUser
        ) {
          window.setTimeout(() => {
            void refreshUserProfile(nextUser);
          }, 0);
        }

        if (event === "SIGNED_IN" && nextUser) {
          if (consumeAuthIntent()) {
            onSignedInRef.current?.(nextUser);
          }
        }
      })();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async () => {
    try {
      if (user?.isGuest) {
        setUser(null);
      }
      await signInWithGoogle();
    } catch (error) {
      const message =
        typeof error?.message === "string" && error.message.length > 0
          ? error.message
          : "Google SSO could not be started. Check Supabase Auth settings.";

      emitError(message);
      throw error;
    }
  }, [emitError, user?.isGuest]);

  const logout = useCallback(
    async ({ reason = "manual" } = {}) => {
      if (user?.isGuest) {
        setUser(null);
        onSignedOutRef.current?.(reason);
        return true;
      }

      if (signOutInProgressRef.current) {
        return false;
      }

      signOutReasonRef.current = reason;
      signOutInProgressRef.current = true;

      try {
        await signOut();
        return true;
      } catch {
        signOutReasonRef.current = "manual";
        signOutInProgressRef.current = false;
        emitError(
          reason === "inactivity"
            ? "Unable to sign out automatically. Please try again."
            : "Unable to sign out right now. Please try again.",
        );
        return false;
      }
    },
    [emitError, user?.isGuest],
  );

  return {
    continueAsGuest,
    isAuthLoading,
    login,
    logout,
    refreshApprovalStatus,
    user,
  };
}
