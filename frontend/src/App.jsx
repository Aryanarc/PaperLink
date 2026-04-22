import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import MetricsPanel from "./components/MetricsPanel";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState(null);

  return (
    <div className="h-screen flex flex-col bg-bg text-text">

      {/* Navbar */}
      <nav className="h-16 border-b border-border/50 backdrop-blur-xl bg-bg/80 sticky top-0 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-panel rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PaperMind
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm text-muted hover:text-text rounded-lg hover:bg-panel transition-colors">
              History
            </button>
            <button className="px-4 py-2 text-sm text-muted hover:text-text rounded-lg hover:bg-panel transition-colors">
              Settings
            </button>
            <div className="h-6 w-px bg-border mx-2" />
            <button className="p-2 hover:bg-panel rounded-lg transition-colors group">
              <svg className="w-5 h-5 text-muted group-hover:text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <div className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          fixed lg:relative inset-y-16 left-0 z-40
          w-80 lg:w-80
          transition-transform duration-300 ease-in-out
        `}>
          <Sidebar />
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col">
          <ChatPanel onMetrics={setLiveMetrics} />
        </div>
      </div>

      <MetricsPanel liveMetrics={liveMetrics} />
    </div>
  );
}