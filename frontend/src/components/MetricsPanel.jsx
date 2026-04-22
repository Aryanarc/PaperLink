import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const METRIC_DEFS = [
  {
    key: "faithfulness",
    label: "Faithfulness",
    description: "Answer accuracy to source material",
    color: "emerald",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "relevancy",
    label: "Relevancy",
    description: "Response relevance to query",
    color: "blue",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: "precision",
    label: "Precision",
    description: "Retrieval context precision",
    color: "purple",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
];

const COLOR_MAP = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-400", track: "bg-emerald-400/15", border: "border-emerald-400/20" },
  blue:    { text: "text-blue-400",    bg: "bg-blue-400",    track: "bg-blue-400/15",    border: "border-blue-400/20"    },
  purple:  { text: "text-purple-400",  bg: "bg-purple-400",  track: "bg-purple-400/15",  border: "border-purple-400/20"  },
};

export default function MetricsPanel({ liveMetrics }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [scores, setScores] = useState({ faithfulness: null, relevancy: null, precision: null });
  const [source, setSource] = useState("idle"); // "idle" | "live" | "eval" | "demo"
  const [isAnimating, setIsAnimating] = useState(false);

  // Load from /eval-summary on mount as baseline
  useEffect(() => {
    fetch(`${API_BASE_URL}/eval-summary`)
      .then((r) => { if (!r.ok) throw new Error("no eval"); return r.json(); })
      .then((data) => {
        const s = data.scores || {};
        setScores({
          faithfulness: s.faithfulness ?? null,
          relevancy:    s.answer_relevancy ?? null,
          precision:    s.context_precision ?? null,
        });
        setSource("eval");
      })
      .catch(() => {
        setSource("demo");
        setScores({ faithfulness: 0.91, relevancy: 0.88, precision: 0.85 });
      });
  }, []);

  // Update when live metrics arrive from a query
  useEffect(() => {
    if (!liveMetrics) return;
    setIsAnimating(true);
    setScores({
      faithfulness: liveMetrics.faithfulness ?? null,
      relevancy:    liveMetrics.relevancy    ?? null,
      precision:    liveMetrics.precision    ?? null,
    });
    setSource("live");
    setIsExpanded(true);
    setTimeout(() => setIsAnimating(false), 600);
  }, [liveMetrics]);

  const sourceLabel = { idle: "No data", live: "Live", eval: "Eval run", demo: "Demo" };
  const sourceDot   = { idle: "bg-gray-400", live: "bg-emerald-400 animate-pulse", eval: "bg-blue-400", demo: "bg-yellow-400" };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`glass border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isAnimating ? "border-primary/60 shadow-primary/20" : "border-border/50"}`}>
        {/* Header */}
        <div
          className="px-4 py-3 border-b border-border/30 flex items-center justify-between cursor-pointer hover:bg-panel/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sourceDot[source]}`} />
            <span className="text-xs font-semibold text-text">
              Quality Metrics
              <span className="ml-1 text-muted font-normal">({sourceLabel[source]})</span>
            </span>
          </div>
          <svg className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Expanded panel */}
        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
          <div className="p-4 space-y-4">
            {source === "demo" && (
              <p className="text-[10px] text-yellow-400/80 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                Showing demo scores. Run <code className="font-mono">python evaluate.py</code> or query to see real scores.
              </p>
            )}
            {source === "live" && (
              <p className="text-[10px] text-emerald-400/90 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                ✓ Live scores from last query
              </p>
            )}

            {METRIC_DEFS.map((m) => {
              const c = COLOR_MAP[m.color];
              const val = scores[m.key];
              const pct = val !== null ? Math.round(val * 100) : null;
              return (
                <div key={m.key} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={c.text}>{m.icon}</div>
                      <span className="text-xs font-medium text-text">{m.label}</span>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${c.text}`}>
                      {pct !== null ? `${pct}%` : "—"}
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${c.track}`}>
                    <div
                      className={`h-full ${c.bg} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: pct !== null ? `${pct}%` : "0%" }}
                    />
                  </div>
                  <p className="text-[10px] text-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="px-4 pb-4">
            <a
              href={`${API_BASE_URL}/eval-summary`}
              target="_blank"
              rel="noreferrer"
              className="block w-full py-2 text-xs text-center text-muted hover:text-text bg-panel/50 hover:bg-panel rounded-lg transition-colors"
            >
              View Full Eval JSON →
            </a>
          </div>
        </div>

        {/* Collapsed summary row */}
        {!isExpanded && (
          <div className="px-4 py-3 flex items-center gap-4">
            {METRIC_DEFS.map((m) => {
              const c = COLOR_MAP[m.color];
              const val = scores[m.key];
              return (
                <div key={m.key} className="flex items-center gap-1.5">
                  <div className={c.text}>{m.icon}</div>
                  <span className={`text-xs font-semibold tabular-nums ${c.text}`}>
                    {val !== null ? `${Math.round(val * 100)}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}