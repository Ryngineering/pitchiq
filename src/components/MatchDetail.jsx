import { useState } from "react";
import { calcPts } from "../data";
import ProbBar from "./ProbBar";
import { ChevronLeft, RefreshCw, Check, Clock } from "lucide-react";

export default function MatchDetail({ match, prediction, onPredict, onBack }) {
  const [selected, setSelected] = useState(null);
  const [changing, setChanging] = useState(false);

  const t1 = match.t1Meta || {
    s: match.t1 || "TBD",
    name: match.t1Name || "Unknown Team",
    bg: "#0B5ED7",
    fg: "#FFFFFF",
    em: "🏏",
    logo: match.t1Logo || null,
  };
  const t2 = match.t2Meta || {
    s: match.t2 || "TBD",
    name: match.t2Name || "Unknown Team",
    bg: "#0B5ED7",
    fg: "#FFFFFF",
    em: "🏏",
    logo: match.t2Logo || null,
  };
  const t2p = 100 - match.t1p;
  const isDone = match.status === "completed";
  const isLive = match.status === "live";
  const hasPred = prediction && !changing;

  const pred = prediction;
  const predWon = isDone && pred && match.winner === pred.team;
  const predLost = isDone && pred && match.winner && match.winner !== pred.team;

  const handleConfirm = () => {
    if (!selected) return;
    const prob = selected === match.t1 ? match.t1p : t2p;
    const pickedTeamId =
      selected === match.t1 ? match.t1TeamId : match.t2TeamId;
    onPredict(match.id, selected, prob, pickedTeamId);
    setChanging(false);
    setSelected(null);
  };

  return (
    <div className="screen">
      <div className="screen-pad">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={18} /> All Matches
        </button>

        <div className="match-hero">
          <div className="match-hero-label">
            <span>{match.label}</span>
            {isLive && <span className="badge-live">● LIVE</span>}
            {match.status === "upcoming" && (
              <span className="badge-upcoming">UPCOMING</span>
            )}
            {isDone && <span className="badge-done">FINAL</span>}
          </div>

          <div className="big-teams">
            <div className="big-team">
              <div className="big-logo" style={{ background: t1.bg }}>
                {match.t1Logo ? (
                  <img
                    src={match.t1Logo}
                    alt={match.t1Name || t1.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 40 }}>{t1.em}</span>
                )}
              </div>
              <span className="big-name">{t1.s}</span>
              {match.t1s && <span className="big-score">{match.t1s}</span>}
              {match.t1o && (
                <span className="big-overs">
                  {match.status !== "upcoming" ? `(${match.t1o} ov)` : ""}
                </span>
              )}
            </div>
            <div className="big-vs">
              <span className="big-vs-text">VS</span>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {match.venue?.split(",").slice(-1)[0]?.trim()}
              </span>
            </div>
            <div className="big-team">
              <div className="big-logo" style={{ background: t2.bg }}>
                {match.t2Logo ? (
                  <img
                    src={match.t2Logo}
                    alt={match.t2Name || t2.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 40 }}>{t2.em}</span>
                )}
              </div>
              <span className="big-name">{t2.s}</span>
              {match.t2s && <span className="big-score">{match.t2s}</span>}
              {match.t2o && (
                <span className="big-overs">
                  {match.status !== "upcoming" && match.t2s !== "—"
                    ? `(${match.t2o} ov)`
                    : ""}
                </span>
              )}
            </div>
          </div>

          <div className="prob-section">
            <div className="prob-section-label">WIN PROBABILITY</div>
            <ProbBar
              t1p={match.t1p}
              t1Label={t1.s}
              t2Label={t2.s}
              t1Color={t1.bg}
              t2Color={t2.bg}
              size="lg"
            />
            {isLive && (
              <div className="prob-update-note">
                <span className="live-dot" /> Updates live as match progresses
              </div>
            )}
            {match.status === "upcoming" && (
              <div className="prob-update-note">
                <Clock size={10} /> Pre-match prediction · Updates at toss
              </div>
            )}
          </div>
        </div>

        {/* COMPLETED MATCH */}
        {isDone && (
          <>
            <div className="result-card">
              <div className="result-label">MATCH RESULT</div>
              <div className="result-winner">
                {match.winner === match.t1
                  ? t1.name
                  : match.winner === match.t2
                    ? t2.name
                    : "Draw"}{" "}
                Won!
              </div>
              <div className="result-margin">
                {match.winner === match.t1
                  ? `${match.t1s} vs ${match.t2s}`
                  : `${match.t2s} vs ${match.t1s}`}
              </div>
            </div>
            {pred && (
              <div className={`user-result-card ${predWon ? "won" : "lost"}`}>
                <span className="user-result-icon">
                  {predWon ? "🎉" : "😔"}
                </span>
                <div className="user-result-info">
                  <div
                    className={`user-result-title ${predWon ? "won" : "lost"}`}
                  >
                    {predWon ? "You called it!" : "Better luck next time"}
                  </div>
                  <div className="user-result-sub">
                    You picked {pred.team || "TBD"} at {pred.prob}% probability
                  </div>
                </div>
                {predWon ? (
                  <span className="user-result-pts won">+{pred.pts}</span>
                ) : (
                  <span className="user-result-pts lost">—</span>
                )}
              </div>
            )}
            {!pred && (
              <div
                style={{
                  padding: "0 16px 14px",
                  fontSize: 13,
                  color: "var(--muted)",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                You didn't make a prediction for this match
              </div>
            )}
          </>
        )}

        {/* ACTIVE MATCH – SHOW PREDICTION PANEL */}
        {!isDone && (
          <>
            {hasPred && (
              <div className="curr-pred-card">
                <div className="cpred-row">
                  <div>
                    <div className="cpred-label">Your Prediction</div>
                    <div className="cpred-val">
                      {pred.team || "TBD"} to win 🏆
                    </div>
                  </div>
                  {!isDone && (
                    <button
                      className="change-btn"
                      onClick={() => {
                        setChanging(true);
                        setSelected(null);
                      }}
                    >
                      <RefreshCw size={12} /> Change
                    </button>
                  )}
                </div>
                <div className="cpred-pts-row">
                  <span className="cpred-pts-label">Points if correct</span>
                  <span className="cpred-pts-val">
                    +{calcPts(pred.prob)} pts
                  </span>
                </div>
              </div>
            )}

            {!hasPred && (
              <div className="pred-panel">
                <div className="pred-panel-title">
                  {changing ? "Change Your Prediction" : "Make Your Prediction"}
                </div>
                <div className="pred-btns">
                  <button
                    className={`pred-btn ${selected === match.t1 ? "selected" : ""}`}
                    onClick={() => setSelected(match.t1)}
                  >
                    <span className="pred-btn-em">{t1.em}</span>
                    <span className="pred-btn-short">{t1.s}</span>
                    <span className="pred-btn-if">If correct:</span>
                    <span className="pred-btn-pts">+{calcPts(match.t1p)}</span>
                  </button>
                  <button
                    className={`pred-btn ${selected === match.t2 ? "selected" : ""}`}
                    onClick={() => setSelected(match.t2)}
                  >
                    <span className="pred-btn-em">{t2.em}</span>
                    <span className="pred-btn-short">{t2.s}</span>
                    <span className="pred-btn-if">If correct:</span>
                    <span className="pred-btn-pts">+{calcPts(t2p)}</span>
                  </button>
                </div>

                {changing && (
                  <button
                    className="change-btn"
                    style={{ marginBottom: 10, fontSize: 13 }}
                    onClick={() => setChanging(false)}
                  >
                    Cancel
                  </button>
                )}

                <button
                  className="confirm-btn"
                  disabled={!selected}
                  onClick={handleConfirm}
                >
                  <Check size={18} />{" "}
                  {changing ? "Confirm Change" : "Lock In Prediction"}
                </button>

                {isLive && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      color: "var(--muted)",
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.5,
                    }}
                  >
                    ⏱ Changing prediction during a live match gives points based
                    on current probability
                  </div>
                )}
              </div>
            )}

            <div className="scoring-info">
              <div className="si-title">⚡ How Points Work</div>
              <div className="si-row">
                <span className="si-text">
                  Pick {t1.s} ({match.t1p}% fav) & win
                </span>
                <span className="si-pts">+{calcPts(match.t1p)}</span>
              </div>
              <div className="si-row">
                <span className="si-text">
                  Pick {t2.s} ({t2p}% underdog) & win
                </span>
                <span className="si-pts">+{calcPts(t2p)}</span>
              </div>
              <div className="si-note">
                Beat the odds = more points. Probability locks in at time of
                prediction.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
