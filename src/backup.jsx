import { useState, useEffect, useRef } from "react";
import {
  Home,
  Trophy,
  User,
  ChevronLeft,
  Bell,
  BarChart2,
  Zap,
  Check,
  RefreshCw,
  Clock,
} from "lucide-react";

// ─── TEAM DATA ────────────────────────────────────────────────────────────────
const T = {
  MI: {
    name: "Mumbai Indians",
    s: "MI",
    bg: "#004BA0",
    fg: "#FFFFFF",
    em: "⚡",
  },
  CSK: {
    name: "Chennai Super Kings",
    s: "CSK",
    bg: "#DFA800",
    fg: "#1B1B1B",
    em: "🦁",
  },
  RCB: {
    name: "Royal Challengers Bengaluru",
    s: "RCB",
    bg: "#CC0000",
    fg: "#FFD700",
    em: "⭐",
  },
  DC: {
    name: "Delhi Capitals",
    s: "DC",
    bg: "#0078BC",
    fg: "#FFFFFF",
    em: "🏛️",
  },
  KKR: {
    name: "Kolkata Knight Riders",
    s: "KKR",
    bg: "#3A225D",
    fg: "#FFD700",
    em: "♞",
  },
  PBKS: {
    name: "Punjab Kings",
    s: "PBKS",
    bg: "#ED1B24",
    fg: "#FFD700",
    em: "👑",
  },
  RR: {
    name: "Rajasthan Royals",
    s: "RR",
    bg: "#E83E8C",
    fg: "#FFFFFF",
    em: "💎",
  },
  SRH: {
    name: "Sunrisers Hyderabad",
    s: "SRH",
    bg: "#FF822A",
    fg: "#1B1B1B",
    em: "🌅",
  },
  GT: {
    name: "Gujarat Titans",
    s: "GT",
    bg: "#1C2C6B",
    fg: "#8FC0E9",
    em: "🔱",
  },
  LSG: {
    name: "Lucknow Super Giants",
    s: "LSG",
    bg: "#00B2FF",
    fg: "#1B1B1B",
    em: "🦅",
  },
};

// ─── MOCK MATCH DATA ──────────────────────────────────────────────────────────
const INITIAL_MATCHES = [
  {
    id: 1,
    t1: "MI",
    t2: "CSK",
    label: "Match 12 · IPL 2025",
    date: "Today · 7:30 PM IST",
    venue: "Wankhede Stadium, Mumbai",
    status: "live",
    t1s: "142/4",
    t1o: "15.2",
    t2s: "—",
    t2o: "Yet to bat",
    t1p: 62,
    totalOvers: 20,
    currentOver: 15.2,
  },
  {
    id: 2,
    t1: "RCB",
    t2: "KKR",
    label: "Match 13 · IPL 2025",
    date: "Tomorrow · 3:30 PM IST",
    venue: "M. Chinnaswamy Stadium, Bengaluru",
    status: "upcoming",
    t1p: 48,
  },
  {
    id: 3,
    t1: "SRH",
    t2: "GT",
    label: "Match 14 · IPL 2025",
    date: "Sat 29 Mar · 7:30 PM IST",
    venue: "Rajiv Gandhi Stadium, Hyderabad",
    status: "upcoming",
    t1p: 55,
  },
  {
    id: 4,
    t1: "SRH",
    t2: "DC",
    label: "Match 11 · IPL 2025",
    date: "Yesterday · 7:30 PM IST",
    venue: "Rajiv Gandhi Stadium, Hyderabad",
    status: "completed",
    winner: "SRH",
    t1s: "198/4",
    t1o: "20",
    t2s: "167/8",
    t2o: "20",
    t1p: 100,
  },
  {
    id: 5,
    t1: "RR",
    t2: "LSG",
    label: "Match 10 · IPL 2025",
    date: "2 days ago · 7:30 PM IST",
    venue: "Sawai Mansingh Stadium, Jaipur",
    status: "completed",
    winner: "LSG",
    t1s: "172/6",
    t1o: "20",
    t2s: "173/4",
    t2o: "18.4",
    t1p: 0,
  },
];

const LB_DATA = [
  { id: 1, name: "Priya Sharma", av: "PS", pts: 47, correct: 6, total: 8 },
  { id: 2, name: "Rahul Mehta", av: "RM", pts: 41, correct: 5, total: 8 },
  { id: 3, name: "You", av: "YO", pts: 35, correct: 5, total: 7, isMe: true },
  { id: 4, name: "Ankit Kumar", av: "AK", pts: 28, correct: 4, total: 6 },
  { id: 5, name: "Sneha Tiwari", av: "ST", pts: 22, correct: 3, total: 5 },
  { id: 6, name: "Dev Patel", av: "DP", pts: 18, correct: 3, total: 6 },
  { id: 7, name: "Meera Reddy", av: "MR", pts: 15, correct: 2, total: 4 },
  { id: 8, name: "Vikram Bose", av: "VB", pts: 12, correct: 2, total: 5 },
];

const INIT_PREDS = {
  4: { team: "SRH", prob: 52, result: "won", pts: 4.8, confirmed: true },
  5: { team: "LSG", prob: 28, result: "won", pts: 7.2, confirmed: true },
};

function calcPts(prob) {
  return +((100 - prob) / 10).toFixed(1);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

:root {
  --bg: #07091A;
  --bg2: #0C1124;
  --card: #0F1628;
  --card2: #162040;
  --border: rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.12);
  --orange: #FF6200;
  --orange-dim: rgba(255,98,0,0.15);
  --gold: #FFB700;
  --gold-dim: rgba(255,183,0,0.12);
  --green: #00D084;
  --red: #FF4757;
  --text: #FFFFFF;
  --sub: rgba(255,255,255,0.7);
  --muted: rgba(255,255,255,0.4);
}

html, body { height: 100%; overflow: hidden; background: var(--bg); }
body { font-family: 'Nunito', sans-serif; color: var(--text); }

#root { height: 100%; }

.app {
  width: 100%; max-width: 430px; height: 100dvh;
  margin: 0 auto; display: flex; flex-direction: column;
  position: relative; background: var(--bg); overflow: hidden;
}

/* SCREEN */
.screen { flex: 1; overflow-y: auto; scrollbar-width: none; }
.screen::-webkit-scrollbar { display: none; }
.screen-pad { padding: 0 0 88px; }

/* HEADER */
.header {
  padding: 14px 18px 12px;
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 20;
}
.header-logo { font-family: 'Bebas Neue'; font-size: 22px; letter-spacing: 2px; color: var(--orange); }
.header-right { display: flex; align-items: center; gap: 10px; }
.pts-chip {
  background: linear-gradient(135deg, var(--orange), var(--gold));
  border-radius: 20px; padding: 4px 12px;
  font-size: 13px; font-weight: 900; color: #1a1a1a;
}
.bell-btn {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--card2); border: 1px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
}
.bell-dot {
  width: 7px; height: 7px; background: var(--orange);
  border-radius: 50%; position: absolute; top: 5px; right: 5px;
  border: 1.5px solid var(--bg);
}

/* BOTTOM NAV */
.bottom-nav {
  height: 74px; background: var(--bg2);
  border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-around;
  flex-shrink: 0; padding: 0 8px 4px;
}
.nav-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 3px; cursor: pointer; padding: 8px 0;
  border: none; background: none; color: var(--muted);
  transition: color 0.15s; font-family: 'Nunito', sans-serif;
}
.nav-btn.active { color: var(--orange); }
.nav-label { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }

/* SECTION */
.section { padding: 18px 16px 0; }
.section-title {
  font-family: 'Bebas Neue'; font-size: 17px; letter-spacing: 1.5px;
  color: var(--muted); margin-bottom: 10px; text-transform: uppercase;
}

/* MATCH CARD */
.match-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 18px; overflow: hidden; cursor: pointer;
  transition: transform 0.15s, border-color 0.2s;
}
.match-card + .match-card { margin-top: 10px; }
.match-card:active { transform: scale(0.985); }
.match-card.live-card { border-color: rgba(0,208,132,0.25); }

.mc-top {
  padding: 10px 14px; display: flex;
  justify-content: space-between; align-items: center;
  border-bottom: 1px solid var(--border);
}
.mc-label { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: 0.5px; }
.badge-live {
  background: var(--green); color: #000;
  font-size: 9px; font-weight: 900; border-radius: 20px;
  padding: 3px 8px; letter-spacing: 1.5px;
  animation: livePulse 2s infinite;
}
.badge-upcoming {
  background: var(--gold-dim); color: var(--gold);
  font-size: 9px; font-weight: 900; border-radius: 20px;
  padding: 3px 8px; letter-spacing: 1px;
}
.badge-done {
  background: rgba(255,255,255,0.06); color: var(--muted);
  font-size: 9px; font-weight: 700; border-radius: 20px;
  padding: 3px 8px; letter-spacing: 1px;
}
@keyframes livePulse {
  0%, 100% { opacity: 1; } 50% { opacity: 0.55; }
}

.mc-body { padding: 14px; display: flex; align-items: center; justify-content: space-between; }
.mc-team { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 78px; }
.mc-logo {
  width: 50px; height: 50px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
}
.mc-short { font-family: 'Bebas Neue'; font-size: 22px; letter-spacing: 1px; }
.mc-score { font-size: 12px; font-weight: 700; color: var(--sub); }
.mc-mid { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.mc-vs { font-family: 'Bebas Neue'; font-size: 13px; color: var(--muted); }
.mc-venue { font-size: 10px; color: var(--muted); text-align: center; max-width: 88px; line-height: 1.5; font-weight: 600; }

/* PROB BAR */
.prob-wrap { padding: 0 14px 14px; }
.prob-bar {
  height: 5px; border-radius: 3px; overflow: hidden;
  background: rgba(255,255,255,0.07); display: flex; margin-bottom: 5px;
}
.prob-fill { transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
.prob-labels { display: flex; justify-content: space-between; }
.prob-pct { font-size: 11px; font-weight: 900; }

/* PRED STRIP */
.pred-strip {
  border-top: 1px solid var(--border);
  padding: 8px 14px;
  display: flex; align-items: center; gap: 6px;
}
.pred-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--orange); flex-shrink: 0; }
.pred-text { font-size: 12px; font-weight: 700; color: var(--sub); }

/* WINNER STRIP */
.winner-strip {
  border-top: 1px solid var(--border);
  padding: 8px 14px;
  display: flex; align-items: center; justify-content: space-between;
}
.winner-text { font-size: 12px; font-weight: 700; color: var(--muted); }
.winner-pts { font-family: 'Bebas Neue'; font-size: 18px; color: var(--green); }
.loser-pts { font-family: 'Bebas Neue'; font-size: 18px; color: var(--muted); }

/* ── LOGIN SCREEN ── */
.login-screen {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 32px 28px; position: relative; overflow: hidden;
}
.login-glow {
  position: absolute; width: 400px; height: 400px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,98,0,0.12) 0%, transparent 70%);
  top: 30%; left: 50%; transform: translate(-50%, -50%);
  pointer-events: none;
}
.login-glow2 {
  position: absolute; width: 250px; height: 250px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,183,0,0.08) 0%, transparent 70%);
  bottom: 20%; right: -60px;
  pointer-events: none;
}
.login-logo-wrap { text-align: center; margin-bottom: 6px; position: relative; }
.login-logo { font-family: 'Bebas Neue'; font-size: 72px; letter-spacing: 5px; line-height: 1; background: linear-gradient(135deg, #FF6200 30%, #FFB700 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.login-ball { font-size: 48px; display: block; margin-bottom: -8px; }
.login-tagline { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: 4px; text-transform: uppercase; margin-bottom: 40px; }
.login-headline { font-size: 26px; font-weight: 900; text-align: center; line-height: 1.3; margin-bottom: 10px; }
.login-headline span { background: linear-gradient(135deg, #FF6200, #FFB700); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.login-desc { font-size: 14px; color: var(--sub); text-align: center; line-height: 1.7; margin-bottom: 44px; font-weight: 600; }

.google-btn {
  width: 100%; max-width: 300px; background: #fff; color: #1a1a1a;
  border: none; border-radius: 16px; padding: 16px 24px;
  font-size: 15px; font-weight: 900; font-family: 'Nunito', sans-serif;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 12px; box-shadow: 0 4px 28px rgba(0,0,0,0.45);
  transition: transform 0.15s, box-shadow 0.15s;
}
.google-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 40px rgba(0,0,0,0.55); }
.google-btn:active { transform: scale(0.97); }
.google-icon { width: 22px; height: 22px; flex-shrink: 0; }

.login-terms { font-size: 11px; color: var(--muted); text-align: center; margin-top: 20px; font-weight: 600; max-width: 240px; line-height: 1.6; }

/* ── MATCH DETAIL ── */
.back-btn {
  background: none; border: none; color: var(--sub);
  font-size: 14px; font-weight: 800; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  font-family: 'Nunito', sans-serif; padding: 16px 16px 0;
}
.back-btn:active { opacity: 0.7; }

.match-hero { padding: 16px; }
.match-hero-label { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: 0.5px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

.big-teams { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.big-team { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
.big-logo { width: 76px; height: 76px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 38px; border: 2px solid rgba(255,255,255,0.08); }
.big-name { font-family: 'Bebas Neue'; font-size: 26px; letter-spacing: 1px; }
.big-score { font-size: 14px; font-weight: 800; color: var(--sub); }
.big-overs { font-size: 11px; font-weight: 600; color: var(--muted); }
.big-vs { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.big-vs-text { font-family: 'Bebas Neue'; font-size: 15px; color: var(--muted); }

.prob-section { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 14px; }
.prob-section-label { font-size: 10px; font-weight: 900; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; text-align: center; margin-bottom: 12px; }
.big-prob-bar { height: 10px; border-radius: 6px; overflow: hidden; background: rgba(255,255,255,0.07); display: flex; margin-bottom: 8px; }
.big-prob-fill { transition: width 1.4s cubic-bezier(0.4,0,0.2,1); }
.big-prob-row { display: flex; justify-content: space-between; align-items: flex-end; }
.big-prob-team { display: flex; flex-direction: column; gap: 1px; }
.big-prob-short { font-size: 11px; font-weight: 800; color: var(--sub); }
.big-prob-num { font-family: 'Bebas Neue'; font-size: 28px; line-height: 1; }
.big-prob-num.high { color: var(--green); }
.big-prob-num.low { color: var(--muted); }
.big-prob-num.even { color: var(--gold); }
.prob-update-note { font-size: 10px; color: var(--muted); text-align: center; margin-top: 6px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px; }
.live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); display: inline-block; animation: livePulse 2s infinite; }

/* PREDICTION PANEL */
.pred-panel { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin: 0 16px 14px; }
.pred-panel-title { font-family: 'Bebas Neue'; font-size: 18px; letter-spacing: 1.5px; color: var(--sub); margin-bottom: 12px; }

.pred-btns { display: flex; gap: 10px; margin-bottom: 12px; }
.pred-btn {
  flex: 1; border: 2px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 14px 10px;
  cursor: pointer; display: flex; flex-direction: column;
  align-items: center; gap: 5px;
  transition: all 0.2s; background: var(--card2);
  font-family: 'Nunito', sans-serif;
}
.pred-btn:active { transform: scale(0.97); }
.pred-btn.selected { border-color: var(--gold); background: rgba(255,183,0,0.08); box-shadow: 0 0 24px rgba(255,183,0,0.15); }
.pred-btn.disabled { opacity: 0.4; cursor: not-allowed; }
.pred-btn-em { font-size: 28px; }
.pred-btn-short { font-family: 'Bebas Neue'; font-size: 20px; letter-spacing: 1px; }
.pred-btn-if { font-size: 10px; font-weight: 700; color: var(--muted); }
.pred-btn-pts { font-family: 'Bebas Neue'; font-size: 22px; color: var(--gold); }

.confirm-btn {
  width: 100%; padding: 15px;
  border: none; border-radius: 14px;
  background: linear-gradient(135deg, var(--orange), var(--gold));
  color: #1a1a1a; font-size: 15px; font-weight: 900;
  font-family: 'Nunito', sans-serif; cursor: pointer;
  transition: all 0.2s; letter-spacing: 0.5px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.confirm-btn:active { transform: scale(0.98); }
.confirm-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* CURRENT PREDICTION */
.curr-pred-card {
  background: rgba(255,183,0,0.07);
  border: 1px solid rgba(255,183,0,0.2);
  border-radius: 14px; padding: 14px 16px;
  margin: 0 16px 10px;
}
.cpred-row { display: flex; justify-content: space-between; align-items: center; }
.cpred-label { font-size: 10px; font-weight: 900; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
.cpred-val { font-size: 16px; font-weight: 900; }
.change-btn {
  background: none; border: 1.5px solid var(--orange);
  border-radius: 10px; color: var(--orange);
  font-size: 12px; font-weight: 900; padding: 7px 13px;
  cursor: pointer; font-family: 'Nunito', sans-serif;
  display: flex; align-items: center; gap: 5px;
  transition: background 0.15s;
}
.change-btn:hover { background: var(--orange-dim); }

.cpred-pts-row { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 6px; }
.cpred-pts-label { font-size: 12px; font-weight: 700; color: var(--sub); flex: 1; }
.cpred-pts-val { font-family: 'Bebas Neue'; font-size: 22px; color: var(--gold); }

/* SCORING INFO */
.scoring-info {
  background: var(--orange-dim); border: 1px solid rgba(255,98,0,0.2);
  border-radius: 14px; padding: 14px 16px; margin: 0 16px 16px;
}
.si-title { font-size: 10px; font-weight: 900; color: var(--orange); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
.si-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.si-text { font-size: 13px; font-weight: 700; color: var(--sub); }
.si-pts { font-family: 'Bebas Neue'; font-size: 20px; color: var(--orange); }
.si-note { font-size: 11px; color: var(--muted); font-weight: 600; margin-top: 6px; line-height: 1.5; }

/* COMPLETED MATCH RESULT */
.result-card {
  background: var(--card2); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px; margin: 0 16px 14px;
  text-align: center;
}
.result-label { font-size: 10px; font-weight: 900; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
.result-winner { font-family: 'Bebas Neue'; font-size: 28px; color: var(--green); letter-spacing: 2px; margin-bottom: 2px; }
.result-margin { font-size: 13px; color: var(--sub); font-weight: 700; }

.user-result-card {
  border-radius: 14px; padding: 14px 16px; margin: 0 16px 14px;
  display: flex; align-items: center; gap: 12px;
}
.user-result-card.won { background: rgba(0,208,132,0.1); border: 1px solid rgba(0,208,132,0.25); }
.user-result-card.lost { background: rgba(255,71,87,0.08); border: 1px solid rgba(255,71,87,0.2); }
.user-result-icon { font-size: 32px; }
.user-result-info { flex: 1; }
.user-result-title { font-size: 15px; font-weight: 900; margin-bottom: 2px; }
.user-result-title.won { color: var(--green); }
.user-result-title.lost { color: var(--red); }
.user-result-sub { font-size: 12px; color: var(--sub); font-weight: 600; }
.user-result-pts { font-family: 'Bebas Neue'; font-size: 32px; color: var(--green); }
.user-result-pts.lost { color: var(--muted); }

/* ── LEADERBOARD ── */
.lb-header { padding: 18px 16px 12px; }
.lb-header-title { font-family: 'Bebas Neue'; font-size: 28px; letter-spacing: 2px; margin-bottom: 4px; }
.lb-header-sub { font-size: 13px; color: var(--sub); font-weight: 600; }

.podium { display: flex; align-items: flex-end; justify-content: center; gap: 6px; padding: 0 16px 20px; }
.podium-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.podium-avatar { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; }
.podium-avatar.r1 { width: 58px; height: 58px; background: linear-gradient(135deg, #FFB700, #FF6200); font-size: 19px; box-shadow: 0 0 24px rgba(255,183,0,0.35); }
.podium-avatar.r2 { width: 50px; height: 50px; background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2); font-size: 16px; }
.podium-avatar.r3 { width: 44px; height: 44px; background: rgba(205,127,50,0.15); border: 1.5px solid rgba(205,127,50,0.3); font-size: 14px; }
.podium-crown { font-size: 18px; margin-bottom: -4px; }
.podium-name { font-size: 11px; font-weight: 800; color: var(--sub); max-width: 72px; text-align: center; }
.podium-pts { font-family: 'Bebas Neue'; font-size: 16px; color: var(--gold); }
.podium-base { border-radius: 10px 10px 0 0; width: 78px; display: flex; align-items: center; justify-content: center; }
.podium-base.b1 { height: 68px; background: linear-gradient(180deg, rgba(255,183,0,0.28), rgba(255,183,0,0.08)); border: 1px solid rgba(255,183,0,0.3); }
.podium-base.b2 { height: 50px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
.podium-base.b3 { height: 38px; background: rgba(205,127,50,0.08); border: 1px solid rgba(205,127,50,0.2); }
.podium-rank { font-family: 'Bebas Neue'; font-size: 22px; color: var(--muted); }

.lb-list { padding: 0 16px 8px; }
.lb-row {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: 14px; margin-bottom: 7px;
  border: 1px solid var(--border); background: var(--card);
}
.lb-row.me { background: var(--orange-dim); border-color: rgba(255,98,0,0.25); }
.lb-rank { font-family: 'Bebas Neue'; font-size: 16px; color: var(--muted); width: 22px; text-align: center; }
.lb-av {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--card2); display: flex; align-items: center;
  justify-content: center; font-size: 11px; font-weight: 900;
  flex-shrink: 0; color: var(--sub);
}
.lb-av.me { background: linear-gradient(135deg, var(--orange), var(--gold)); color: #1a1a1a; }
.lb-info { flex: 1; }
.lb-name { font-size: 14px; font-weight: 900; }
.lb-stat { font-size: 11px; color: var(--muted); font-weight: 700; margin-top: 1px; }
.lb-pts { font-family: 'Bebas Neue'; font-size: 24px; color: var(--gold); }

/* ── PROFILE ── */
.profile-hero { padding: 24px 16px 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.profile-av {
  width: 76px; height: 76px; border-radius: 50%;
  background: linear-gradient(135deg, var(--orange), var(--gold));
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; font-weight: 900; border: 3px solid rgba(255,255,255,0.1);
}
.profile-name { font-size: 20px; font-weight: 900; }
.profile-email { font-size: 13px; color: var(--muted); font-weight: 600; }
.profile-rank { font-size: 13px; color: var(--sub); font-weight: 700; background: var(--orange-dim); padding: 4px 14px; border-radius: 20px; border: 1px solid rgba(255,98,0,0.2); }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 4px 16px 16px; }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 14px 10px; text-align: center; }
.stat-val { font-family: 'Bebas Neue'; font-size: 30px; color: var(--gold); }
.stat-lbl { font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px; }

.hist-list { padding: 0 16px 16px; }
.hist-item {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 14px; padding: 13px 14px;
  display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
}
.hist-teams { display: flex; align-items: center; gap: 6px; }
.hist-badge { font-size: 20px; }
.hist-info { flex: 1; }
.hist-match { font-size: 13px; font-weight: 900; margin-bottom: 2px; }
.hist-pick { font-size: 11px; color: var(--muted); font-weight: 700; }
.hist-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.hist-pts { font-family: 'Bebas Neue'; font-size: 22px; }
.hist-pts.won { color: var(--green); }
.hist-pts.lost { color: var(--muted); }
.hist-tag { font-size: 10px; font-weight: 900; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 6px; }
.hist-tag.won { background: rgba(0,208,132,0.15); color: var(--green); }
.hist-tag.lost { background: rgba(255,71,87,0.12); color: var(--red); }

/* TOAST */
.toast {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  background: var(--card2); border: 1px solid var(--border2);
  border-radius: 16px; padding: 12px 18px;
  display: flex; align-items: center; gap: 10px;
  z-index: 999; font-size: 14px; font-weight: 800;
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
  max-width: 350px; width: calc(100% - 32px);
  animation: toastIn 0.3s ease;
}
@keyframes toastIn {
  from { transform: translateX(-50%) translateY(-16px); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0); opacity: 1; }
}

.notif-panel { padding: 0 16px 16px; }
.notif-item { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 13px 14px; display: flex; gap: 12px; align-items: flex-start; margin-bottom: 8px; }
.notif-em { font-size: 24px; flex-shrink: 0; }
.notif-text { font-size: 13px; font-weight: 700; color: var(--sub); line-height: 1.5; }
.notif-time { font-size: 11px; color: var(--muted); font-weight: 600; margin-top: 3px; }
`;

// ─── INJECT CSS ────────────────────────────────────────────────────────────────
const styleEl = document.createElement("style");
styleEl.textContent = CSS;
document.head.appendChild(styleEl);

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Toast({ msg, emoji }) {
  return (
    <div className="toast">
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span>{msg}</span>
    </div>
  );
}

function ProbBar({ t1p, t1key, t2key, size = "sm" }) {
  const t2p = 100 - t1p;
  const t1Color = T[t1key]?.bg || "#666";
  const t2Color = T[t2key]?.bg || "#999";
  if (size === "lg") {
    return (
      <div>
        <div className="big-prob-bar">
          <div
            className="big-prob-fill"
            style={{ width: `${t1p}%`, background: t1Color }}
          />
          <div
            className="big-prob-fill"
            style={{ width: `${t2p}%`, background: t2Color }}
          />
        </div>
        <div className="big-prob-row">
          <div className="big-prob-team" style={{ alignItems: "flex-start" }}>
            <span className="big-prob-short">{T[t1key]?.s}</span>
            <span
              className={`big-prob-num ${t1p > 55 ? "high" : t1p < 45 ? "low" : "even"}`}
            >
              {t1p}%
            </span>
          </div>
          <div className="big-prob-team" style={{ alignItems: "flex-end" }}>
            <span className="big-prob-short">{T[t2key]?.s}</span>
            <span
              className={`big-prob-num ${t2p > 55 ? "high" : t2p < 45 ? "low" : "even"}`}
            >
              {t2p}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="prob-wrap">
      <div className="prob-bar">
        <div
          className="prob-fill"
          style={{ width: `${t1p}%`, background: t1Color }}
        />
        <div
          className="prob-fill"
          style={{ width: `${t2p}%`, background: t2Color }}
        />
      </div>
      <div className="prob-labels">
        <span className="prob-pct" style={{ color: t1Color }}>
          {t1p}%
        </span>
        <span className="prob-pct" style={{ color: t2Color }}>
          {t2p}%
        </span>
      </div>
    </div>
  );
}

function MatchCard({ match, prediction, onClick }) {
  const t1 = T[match.t1],
    t2 = T[match.t2];
  const hasPred = prediction && !prediction.confirmed;
  const isDone = match.status === "completed";
  const isLive = match.status === "live";
  const pred = prediction;

  const predWon = isDone && pred && match.winner === pred.team;
  const predLost = isDone && pred && match.winner && match.winner !== pred.team;

  return (
    <div
      className={`match-card ${isLive ? "live-card" : ""}`}
      onClick={onClick}
    >
      <div className="mc-top">
        <span className="mc-label">{match.label}</span>
        {isLive && <span className="badge-live">● LIVE</span>}
        {match.status === "upcoming" && (
          <span className="badge-upcoming">UPCOMING</span>
        )}
        {isDone && <span className="badge-done">FINAL</span>}
      </div>

      <div className="mc-body">
        <div className="mc-team">
          <div className="mc-logo" style={{ background: t1.bg }}>
            <span>{t1.em}</span>
          </div>
          <span
            className="mc-short"
            style={{ color: t1.fg === "#FFFFFF" ? "#fff" : t1.bg }}
          >
            {t1.s}
          </span>
          {match.t1s && <span className="mc-score">{match.t1s}</span>}
        </div>
        <div className="mc-mid">
          <span className="mc-vs">VS</span>
          <span className="mc-venue">{match.venue?.split(",")[0]}</span>
          {isLive && (
            <span
              style={{ fontSize: 10, color: "var(--green)", fontWeight: 800 }}
            >
              Ov {match.currentOver}
            </span>
          )}
          {match.status === "upcoming" && (
            <span
              style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}
            >
              {match.date.split("·")[0].trim()}
            </span>
          )}
        </div>
        <div className="mc-team">
          <div className="mc-logo" style={{ background: t2.bg }}>
            <span>{t2.em}</span>
          </div>
          <span
            className="mc-short"
            style={{ color: t2.fg === "#FFFFFF" ? "#fff" : t2.bg }}
          >
            {t2.s}
          </span>
          {match.t2s && <span className="mc-score">{match.t2s}</span>}
        </div>
      </div>

      {!isDone && <ProbBar t1p={match.t1p} t1key={match.t1} t2key={match.t2} />}

      {pred && !isDone && (
        <div className="pred-strip">
          <div className="pred-dot" />
          <span className="pred-text">
            You picked <strong>{T[pred.team]?.s}</strong> · {calcPts(pred.prob)}{" "}
            pts if correct
          </span>
        </div>
      )}

      {isDone && pred && (
        <div className="winner-strip">
          <span className="winner-text">
            {match.winner ? `${T[match.winner]?.s} won` : "Match drawn"}
            {pred ? ` · You picked ${T[pred.team]?.s}` : ""}
          </span>
          {predWon && <span className="winner-pts">+{pred.pts} pts ✓</span>}
          {predLost && <span className="loser-pts">—</span>}
          {!pred && <span className="loser-pts">No pick</span>}
        </div>
      )}

      {!pred && !isDone && (
        <div className="pred-strip">
          <div className="pred-dot" style={{ background: "var(--muted)" }} />
          <span className="pred-text" style={{ color: "var(--muted)" }}>
            Tap to make your prediction
          </span>
        </div>
      )}
    </div>
  );
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
function HomeScreen({ matches, predictions, onMatch, myPoints, onBell }) {
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const done = matches.filter((m) => m.status === "completed");

  return (
    <div className="screen">
      <div className="header">
        <span className="header-logo">🏏 PITCHIQ</span>
        <div className="header-right">
          <span className="pts-chip">⚡ {myPoints} PTS</span>
          <button className="bell-btn" onClick={onBell}>
            <Bell size={16} color="rgba(255,255,255,0.6)" />
            <div className="bell-dot" />
          </button>
        </div>
      </div>

      <div className="screen-pad">
        {live.length > 0 && (
          <div className="section">
            <div className="section-title">🟢 Live Now</div>
            {live.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predictions[m.id]}
                onClick={() => onMatch(m.id)}
              />
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="section">
            <div className="section-title">⏳ Upcoming</div>
            {upcoming.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predictions[m.id]}
                onClick={() => onMatch(m.id)}
              />
            ))}
          </div>
        )}

        {done.length > 0 && (
          <div className="section">
            <div className="section-title">✅ Completed</div>
            {done.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predictions[m.id]}
                onClick={() => onMatch(m.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MATCH DETAIL ─────────────────────────────────────────────────────────────
function MatchDetail({ match, prediction, onPredict, onBack }) {
  const [selected, setSelected] = useState(null);
  const [changing, setChanging] = useState(false);
  const t1 = T[match.t1],
    t2 = T[match.t2];
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
    onPredict(match.id, selected, prob);
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
                <span style={{ fontSize: 40 }}>{t1.em}</span>
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
                <span style={{ fontSize: 40 }}>{t2.em}</span>
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
              t1key={match.t1}
              t2key={match.t2}
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
                {T[match.winner]?.name || "Draw"} Won!
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
                    You picked {T[pred.team]?.s} at {pred.prob}% probability
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
                    <div className="cpred-val">{T[pred.team]?.s} to win 🏆</div>
                  </div>
                  {isLive && (
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
              <div className="pred-panel" style={{ margin: "0 16px 14px" }}>
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

// ─── LEADERBOARD SCREEN ───────────────────────────────────────────────────────
function LeaderboardScreen() {
  const top3 = [LB_DATA[1], LB_DATA[0], LB_DATA[2]]; // 2nd, 1st, 3rd for podium layout
  const rest = LB_DATA.slice(3);
  const podiumStyles = ["r2", "r1", "r3"];
  const baseStyles = ["b2", "b1", "b3"];
  const crowns = [null, "👑", null];
  const rankNums = [2, 1, 3];

  return (
    <div className="screen">
      <div className="header">
        <span className="header-logo">🏏 PITCHIQ</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--muted)" }}>
          IPL 2025 · Match 12
        </span>
      </div>
      <div className="screen-pad">
        <div className="lb-header">
          <div className="lb-header-title">Leaderboard</div>
          <div className="lb-header-sub">
            12 colleagues competing · Updated live
          </div>
        </div>

        <div className="podium">
          {top3.map((p, i) => (
            <div key={p.id} className="podium-item">
              {crowns[i] && <span className="podium-crown">{crowns[i]}</span>}
              <div className={`podium-avatar ${podiumStyles[i]}`}>{p.av}</div>
              <span className="podium-name">{p.name}</span>
              <span className="podium-pts">{p.pts} pts</span>
              <div className={`podium-base ${baseStyles[i]}`}>
                <span className="podium-rank">{rankNums[i]}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lb-list">
          {LB_DATA.map((p, i) => (
            <div key={p.id} className={`lb-row ${p.isMe ? "me" : ""}`}>
              <span className="lb-rank">{i + 1}</span>
              <div className={`lb-av ${p.isMe ? "me" : ""}`}>{p.av}</div>
              <div className="lb-info">
                <div className="lb-name">
                  {p.name} {p.isMe ? "← You" : ""}
                </div>
                <div className="lb-stat">
                  {p.correct}/{p.total} correct ·{" "}
                  {Math.round((p.correct / p.total) * 100)}% accuracy
                </div>
              </div>
              <span className="lb-pts">{p.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE SCREEN ───────────────────────────────────────────────────────────
function ProfileScreen({ user }) {
  const NOTIFS = [
    {
      em: "🎉",
      text: "You earned 7.2 points! LSG won vs RR — your underdog pick paid off!",
      time: "2 days ago",
    },
    {
      em: "📈",
      text: "You moved up to #3 on the leaderboard!",
      time: "2 days ago",
    },
    {
      em: "🔔",
      text: "MI vs CSK is live now — make your prediction!",
      time: "Today · 7:28 PM",
    },
  ];

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
          <div className="profile-av">YO</div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-email">{user.email}</div>
          <div className="profile-rank">🏆 Rank #3 of 12</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">35</div>
            <div className="stat-lbl">Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">5/7</div>
            <div className="stat-lbl">Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">71%</div>
            <div className="stat-lbl">Accuracy</div>
          </div>
        </div>

        <div className="section" style={{ marginBottom: 12 }}>
          <div className="section-title">📋 Prediction History</div>
        </div>

        <div className="hist-list">
          {HISTORY.map((h, i) => {
            const m = INITIAL_MATCHES.find((x) => x.id === h.matchId);
            return (
              <div key={i} className="hist-item">
                <span className="hist-badge">{T[h.picked]?.em}</span>
                <div className="hist-info">
                  <div className="hist-match">
                    {T[m?.t1]?.s} vs {T[m?.t2]?.s}
                  </div>
                  <div className="hist-pick">
                    Picked {T[h.picked]?.s} at {h.prob}% odds
                  </div>
                </div>
                <div className="hist-right">
                  <span className={`hist-pts ${h.result}`}>+{h.pts}</span>
                  <span className={`hist-tag ${h.result}`}>
                    {h.result === "won" ? "WON ✓" : "LOST"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="section" style={{ marginBottom: 12 }}>
          <div className="section-title">🔔 Notifications</div>
        </div>

        <div className="notif-panel">
          {NOTIFS.map((n, i) => (
            <div key={i} className="notif-item">
              <span className="notif-em">{n.em}</span>
              <div>
                <div className="notif-text">{n.text}</div>
                <div className="notif-time">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const handleLogin = () => {
    setLoading(true);
    setTimeout(
      () => onLogin({ name: "Ryngineer", email: "you@company.com" }),
      1200,
    );
  };
  return (
    <div className="app">
      <div className="login-screen">
        <div className="login-glow" />
        <div className="login-glow2" />
        <div className="login-logo-wrap">
          <span className="login-ball">🏏</span>
          <div className="login-logo">PITCHIQ</div>
        </div>
        <div className="login-tagline">IPL 2025 · Predict & Win</div>
        <div className="login-headline">
          Who will <span>win</span> tonight?
        </div>
        <div className="login-desc">
          Predict match winners, beat the odds,
          <br />
          climb the leaderboard with your colleagues.
        </div>
        <button className="google-btn" onClick={handleLogin} disabled={loading}>
          {!loading ? (
            <>
              <svg className="google-icon" viewBox="0 0 24 24">
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
              Continue with Google
            </>
          ) : (
            <span>Signing you in…</span>
          )}
        </button>
        <div className="login-terms">
          By continuing you agree to our Terms of Service.
          <br />
          SSO secured via Supabase Auth.
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  const items = [
    { key: "home", icon: <Home size={22} />, label: "Matches" },
    { key: "leaderboard", icon: <Trophy size={22} />, label: "Rankings" },
    { key: "profile", icon: <User size={22} />, label: "Profile" },
  ];
  return (
    <div className="bottom-nav">
      {items.map((it) => (
        <button
          key={it.key}
          className={`nav-btn ${active === it.key ? "active" : ""}`}
          onClick={() => onChange(it.key)}
        >
          {it.icon}
          <span className="nav-label">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [matches, setMatches] = useState(INITIAL_MATCHES);
  const [selectedId, setSelectedId] = useState(null);
  const [predictions, setPredictions] = useState(INIT_PREDS);
  const [toast, setToast] = useState(null);

  // Simulate live probability shifting
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) => {
          if (m.status !== "live") return m;
          const delta = (Math.random() - 0.46) * 3.5;
          const newP = Math.min(88, Math.max(12, m.t1p + delta));
          return { ...m, t1p: Math.round(newP) };
        }),
      );
    }, 2800);
    return () => clearInterval(iv);
  }, [user]);

  const showToast = (msg, emoji = "🏏") => {
    setToast({ msg, emoji });
    setTimeout(() => setToast(null), 3200);
  };

  const handlePredict = (matchId, team, prob) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        team,
        prob,
        result: null,
        pts: calcPts(prob),
        confirmed: false,
      },
    }));
    showToast(
      `Locked in! ${T[team].s} to win · ${calcPts(prob)} pts if correct`,
      "🔐",
    );
  };

  const myPoints = 35;
  const selectedMatch = matches.find((m) => m.id === selectedId);

  if (!user)
    return (
      <LoginScreen
        onLogin={(u) => {
          setUser(u);
          setScreen("home");
        }}
      />
    );

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
      {screen === "leaderboard" && <LeaderboardScreen />}
      {screen === "profile" && <ProfileScreen user={user} />}

      <BottomNav
        active={screen === "match" ? "home" : screen}
        onChange={(s) => setScreen(s)}
      />
    </div>
  );
}
