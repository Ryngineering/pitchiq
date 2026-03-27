import { useCallback, useEffect, useRef, useState } from "react";
import {
  consumeAuthIntent,
  getAuthenticatedUser,
  hasSupabaseConfig,
  mapAuthUser,
  refreshUserProfile,
  signInWithGoogle,
  signOut,
  supabase,
} from "../lib/supabase";

const AUTH_BOOTSTRAP_TIMEOUT_MS = 8000;

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

        if (!ignore) {
          setUser(authenticatedUser);
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

      let nextUser = null;

      try {
        if (session?.user) {
          nextUser = mapAuthUser(session.user);
        }

        setUser(nextUser);
      } catch {
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }

      if (event === "SIGNED_IN" && nextUser) {
        window.setTimeout(() => {
          void refreshUserProfile(nextUser);
        }, 0);

        if (consumeAuthIntent()) {
          onSignedInRef.current?.(nextUser);
        }
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      const message =
        typeof error?.message === "string" && error.message.length > 0
          ? error.message
          : "Google SSO could not be started. Check Supabase Auth settings.";

      emitError(message);
      throw error;
    }
  }, [emitError]);

  const logout = useCallback(
    async ({ reason = "manual" } = {}) => {
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
    [emitError],
  );

  return {
    isAuthLoading,
    login,
    logout,
    user,
  };
}
