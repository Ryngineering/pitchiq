import React from "react";

export default function Toast({ msg, emoji }) {
  return (
    <div className="toast">
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span>{msg}</span>
    </div>
  );
}
