import { useCallback, useEffect, useState } from "react";
import { calcPts } from "../data";
import {
  buildTeamLookup,
  fetchLeaderboard,
  fetchMyPredictions,
  loadAndCacheCricketTeams,
  mapDbMatchToFrontend,
  supabase,
} from "../lib/supabase";

export default function usePitchData({ onError, user }) {
  const [matches, setMatches] = useState([]);
  const [myPoints, setMyPoints] = useState(0);
  const [predictions, setPredictions] = useState({});
  const [teamLookup, setTeamLookup] = useState({});

  const emitError = useCallback(
    (message) => {
      onError?.(message);
    },
    [onError],
  );

  const loadPredictions = useCallback(
    async (userId, isCancelled = () => false) => {
      const rows = await fetchMyPredictions(userId);
      if (isCancelled()) {
        return;
      }

      const nextPredictions = {};
      for (const row of rows) {
        nextPredictions[row.matchId] = {
          matchId: row.matchId,
          team: row.picked,
          prob: row.prob,
          result: row.result,
          pts: row.pts ?? calcPts(row.prob),
          confirmed: row.result !== "pending",
        };
      }

      setPredictions(nextPredictions);
    },
    [],
  );

  const loadPoints = useCallback(async (userId, isCancelled = () => false) => {
    const rows = await fetchLeaderboard(userId);
    if (isCancelled()) {
      return;
    }

    const me = rows.find((row) => row.isMe);
    setMyPoints(me?.pts ?? 0);
  }, []);

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
          emitError("Unable to load team metadata.");
        }
      }
    };

    bootstrapTeams();

    return () => {
      isCancelled = true;
    };
  }, [emitError, user]);

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
        emitError("Unable to load matches right now.");
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
            const existingIndex = prev.findIndex(
              (match) => match.id === mapped.id,
            );
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
  }, [emitError, teamLookup, user]);

  useEffect(() => {
    if (!user || !supabase) {
      return undefined;
    }

    let isCancelled = false;

    void loadPredictions(user.id, () => isCancelled);

    const channel = supabase
      .channel(`user-predictions-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_predictions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadPredictions(user.id, () => isCancelled);
          void loadPoints(user.id, () => isCancelled);
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  }, [loadPoints, loadPredictions, user]);

  useEffect(() => {
    if (!user || !supabase) {
      return undefined;
    }

    let isCancelled = false;

    void loadPoints(user.id, () => isCancelled);

    return () => {
      isCancelled = true;
    };
  }, [loadPoints, user]);

  return {
    matches: user ? matches : [],
    myPoints: user ? myPoints : 0,
    predictions: user ? predictions : {},
    setPredictions,
  };
}
