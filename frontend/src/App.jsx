import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutDashboard, Sprout, Activity, Droplets, BarChart3, History as HistoryIcon, Settings as Cog, Bell, Leaf, Menu, Play, Pause, RotateCcw, X } from "lucide-react";
import { api } from "./services/api.js";
import { Tag, Spinner } from "./components/ui.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Plants from "./pages/Plants.jsx";
import Monitoring from "./pages/Monitoring.jsx";
import Irrigation from "./pages/Irrigation.jsx";
import Analytics from "./pages/Analytics.jsx";
import History from "./pages/History.jsx";
import SettingsPage from "./pages/Settings.jsx";

const NAV = [
  ["dashboard", "Dashboard", LayoutDashboard, Dashboard], ["plants", "Plant Management", Sprout, Plants],
  ["monitoring", "Live Monitoring", Activity, Monitoring], ["irrigation", "Irrigation Control", Droplets, Irrigation],
  ["analytics", "Analytics & Reports", BarChart3, Analytics], ["history", "Irrigation History", HistoryIcon, History], ["settings", "Settings", Cog, SettingsPage],
];
const TOAST = { success: "border-green-500", warning: "border-amber-500", info: "border-sky-500" };

export default function App() {
  const [page, setPage] = useState(location.hash.slice(1) || "dashboard");
  const [dash, setDash] = useState(null), [error, setError] = useState(null);
  const [notes, setNotes] = useState({ items: [], unread: 0 }), [panel, setPanel] = useState(false);
  const [toasts, setToasts] = useState([]), [menu, setMenu] = useState(false);
  const seen = useRef(null);

  const toast = useCallback((message, type = "info") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const refresh = useCallback(async () => {
    try { setDash(await api.get("/dashboard")); setError(null); } catch (e) { setError(e.message); }
  }, []);

  // Polling: dashboard every 2 s, notifications every 3 s (new ones become toasts).
  useEffect(() => { refresh(); const i = setInterval(refresh, 2000); return () => clearInterval(i); }, [refresh]);
  useEffect(() => {
    const f = async () => {
      try {
        const n = await api.get("/notifications");
        if (seen.current !== null) n.items.filter((x) => x.id > seen.current).reverse().forEach((x) => toast(x.message, x.type));
        seen.current = n.items[0]?.id ?? 0; setNotes(n);
      } catch { /* shown via dashboard error banner */ }
    };
    f(); const i = setInterval(f, 3000); return () => clearInterval(i);
  }, [toast]);

  const go = (p) => { setPage(p); location.hash = p; setMenu(false); };
  const sim = async (action) => { try { await api.post(`/simulation/${action}`); refresh(); } catch (e) { toast(e.message, "warning"); } };
  const [, title, , Page] = NAV.find((n) => n[0] === page) || NAV[0];
  const running = dash?.state.running;

  return (
    <div className="min-h-screen flex">
      <aside className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-white border-r border-green-100 p-4 transition-transform ${menu ? "" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2 px-2 py-3 mb-4"><div className="h-9 w-9 rounded-xl bg-brand text-white grid place-items-center"><Leaf size={20} /></div>
          <div><p className="font-extrabold leading-tight">AquaSprout</p><p className="text-[11px] text-gray-500">Smart Irrigation</p></div></div>
        <nav className="space-y-1">{NAV.map(([id, label, I]) => (
          <button key={id} onClick={() => go(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${page === id ? "bg-brand text-white" : "text-gray-600 hover:bg-brand-light"}`}><I size={18} />{label}</button>))}</nav>
      </aside>
      {menu && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMenu(false)} />}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-green-100 px-4 lg:px-8 py-3 flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu /></button>
          <h1 className="font-bold text-lg mr-auto">{title}</h1>
          <span className="hidden sm:block"><Tag /></span>
          <button className="btn-primary" onClick={() => sim(running ? "pause" : "start")}>{running ? <Pause size={16} /> : <Play size={16} />}<span className="hidden md:inline">{running ? "Pause" : "Start"}</span></button>
          <button className="btn-ghost" onClick={() => sim("reset")} aria-label="Reset simulation"><RotateCcw size={16} /></button>
          <div className="relative">
            <button className="relative p-2 rounded-xl hover:bg-brand-light" aria-label="Notifications" onClick={() => { setPanel(!panel); if (!panel) api.post("/notifications/read").catch(() => {}); }}>
              <Bell size={20} />{notes.unread > 0 && !panel && <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] grid place-items-center">{notes.unread}</span>}
            </button>
            {panel && <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white rounded-2xl shadow-xl border border-green-100 p-3">
              <div className="flex justify-between mb-2"><b className="text-sm">Notifications</b><button onClick={() => setPanel(false)}><X size={16} /></button></div>
              {notes.items.length === 0 ? <p className="text-sm text-gray-400 p-4 text-center">No alerts yet.</p> : notes.items.map((n) => (
                <div key={n.id} className={`text-sm border-l-4 pl-3 py-2 mb-1 ${TOAST[n.type] || TOAST.info}`}>{n.message}<p className="text-[11px] text-gray-400">{n.created_at}</p></div>))}
            </div>}
          </div>
          <div className="h-9 w-9 rounded-full bg-brand text-white grid place-items-center text-sm font-bold" title="Profile">SI</div>
        </header>
        <main className="p-4 lg:p-8 max-w-7xl">
          {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>}
          {!dash ? <Spinner /> : <Page dash={dash} refresh={refresh} toast={toast} />}
        </main>
      </div>
      <div className="fixed bottom-4 right-4 z-50 space-y-2">{toasts.map((t) => <div key={t.id} className={`bg-white shadow-lg rounded-xl border-l-4 ${TOAST[t.type] || TOAST.info} px-4 py-3 text-sm max-w-xs`}>{t.message}</div>)}</div>
    </div>
  );
}
