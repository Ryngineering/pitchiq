import React from "react";
import { Home, Trophy, User } from "lucide-react";

export default function BottomNav({ active, onChange }) {
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
