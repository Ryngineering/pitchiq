import React from "react";

export default function ProbBar({
  t1p,
  t1Label = "T1",
  t2Label = "T2",
  t1Color = "#0B5ED7",
  t2Color = "#0B5ED7",
  size = "sm",
}) {
  const t2p = 100 - t1p;
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
            <span className="big-prob-short">{t1Label}</span>
            <span
              className={`big-prob-num ${t1p > 55 ? "high" : t1p < 45 ? "low" : "even"}`}
            >
              {t1p}%
            </span>
          </div>
          <div className="big-prob-team" style={{ alignItems: "flex-end" }}>
            <span className="big-prob-short">{t2Label}</span>
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
