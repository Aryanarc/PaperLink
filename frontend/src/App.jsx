import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import MetricsPanel from "./components/MetricsPanel";

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-bg text-text">

      {/* Navbar */}
      <div className="h-12 border-b border-border flex items-center px-4 justify-between">
        <h1 className="text-2xl text-red-500">PaperMind</h1>
        <button>🌙</button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ChatPanel />
      </div>

      <MetricsPanel />
    </div>
  );
}