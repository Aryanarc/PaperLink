import { useState } from "react";

export default function MetricsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  const metrics = [
    { 
      label: "Faithfulness", 
      value: 0.91, 
      description: "Answer accuracy to source material",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "emerald"
    },
    { 
      label: "Relevancy", 
      value: 0.88,
      description: "Response relevance to query",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "blue"
    },
    { 
      label: "Precision", 
      value: 0.85,
      description: "Answer specificity",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      color: "purple"
    }
  ];

  const getColorClasses = (color, value) => {
    const colors = {
      emerald: {
        text: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/20",
        fill: "fill-emerald-400/20"
      },
      blue: {
        text: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/20",
        fill: "fill-blue-400/20"
      },
      purple: {
        text: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/20",
        fill: "fill-purple-400/20"
      }
    };
    return colors[color] || colors.emerald;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="glass border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div 
          className="px-4 py-3 border-b border-border/30 flex items-center justify-between cursor-pointer hover:bg-panel/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-text">Quality Metrics</span>
          </div>
          <button className="text-muted hover:text-text transition-colors">
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Metrics */}
        <div className={`
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="p-4 space-y-3">
            {metrics.map((metric, i) => {
              const colors = getColorClasses(metric.color, metric.value);
              return (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`${colors.text}`}>
                        {metric.icon}
                      </div>
                      <span className="text-xs font-medium text-text">
                        {metric.label}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {(metric.value * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className={`h-1.5 bg-panel rounded-full overflow-hidden ${colors.border} border`}>
                    <div 
                      className={`h-full ${colors.bg} transition-all duration-500 ease-out`}
                      style={{ width: `${metric.value * 100}%` }}
                    />
                  </div>

                  {/* Description - shows on hover */}
                  <p className="text-[10px] text-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {metric.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <button className="w-full py-2 text-xs text-muted hover:text-text bg-panel/50 hover:bg-panel rounded-lg transition-colors">
              View Detailed Report
            </button>
          </div>
        </div>

        {/* Compact View */}
        {!isExpanded && (
          <div className="px-4 py-3 flex items-center gap-4">
            {metrics.map((metric, i) => {
              const colors = getColorClasses(metric.color, metric.value);
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`${colors.text}`}>
                    {metric.icon}
                  </div>
                  <span className={`text-xs font-semibold ${colors.text}`}>
                    {(metric.value * 100).toFixed(0)}%
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