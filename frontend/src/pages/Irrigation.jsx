import { useEffect, useState } from "react";
import { Power, CloudOff } from "lucide-react";
import { api } from "../services/api.js";
import { Card, Toggle, Badge } from "../components/ui.jsx";

export default function Irrigation({ dash, refresh, toast }) {
  const [info, setInfo] = useState(null);
  const s = dash.state, p = dash.plant;
  const load = () => api.get("/irrigation/status").then(setInfo).catch((e) => toast(e.message, "warning"));
  useEffect(() => { load(); }, [dash.state.pump_on, dash.state.running]);   // eslint-disable-line
  if (!info) return null;
  const st = info.settings;
  const run = async (fn, msg) => { try { await fn(); if (msg) toast(msg, "success"); await load(); refresh(); } catch (e) { toast(e.message, "warning"); } };
  const goal = p.target_moisture, pct = s.session ? Math.max(0, Math.min(100, ((s.moisture - s.session.start_moisture) / Math.max(goal - s.session.start_moisture, 1)) * 100)) : 0;
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="Control mode">
        <div className="flex items-center justify-between py-2"><div><p className="font-medium">Automatic irrigation</p><p className="text-xs text-gray-500">Starts below {p.min_moisture}%, stops at target {p.target_moisture}% (hysteresis)</p></div>
          <Toggle on={st.auto_irrigation} onChange={(v) => run(() => api.post("/irrigation/auto", { enabled: v }), `Automatic irrigation ${v ? "enabled" : "disabled"}`)} /></div>
        <div className="flex items-center justify-between py-2 border-t border-gray-100"><div><p className="font-medium">Manual override</p><p className="text-xs text-gray-500">Overrides automatic control while active</p></div>
          <Toggle on={st.manual_mode} onChange={(v) => run(() => api.post("/irrigation/manual", { manual_mode: v, pump_on: false }), v ? "Manual mode on" : "Back to automatic")} /></div>
        <button className={`${s.pump_on ? "btn-danger" : "btn-primary"} w-full mt-3`} disabled={!st.manual_mode || !s.running}
          onClick={() => run(() => api.post("/irrigation/manual", { manual_mode: true, pump_on: !s.pump_on }), s.pump_on ? "Pump stopped" : "Pump started")}>
          <Power size={16} />{s.pump_on ? "Turn pump OFF" : "Turn pump ON"}</button>
        {!s.running && <p className="text-xs text-amber-700 mt-2">Simulation is paused, so the pump is disabled.</p>}
        {!st.manual_mode && s.running && <p className="text-xs text-gray-400 mt-2">Enable manual override to use the pump button.</p>}
      </Card>
      <Card title="Pump status">
        <p className="text-3xl font-extrabold">{s.pump_on ? "ON" : "OFF"} <span className="text-sm font-medium text-gray-500">{s.pump_mode}</span></p>
        <div className="mt-4"><div className="flex justify-between text-xs text-gray-500"><span>Watering progress</span><span>{s.moisture}% → {goal}%</span></div>
          <div className="h-3 bg-gray-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${pct}%` }} /></div></div>
        <p className="text-sm text-gray-500 mt-3">Total simulated sessions: <b>{info.total_sessions}</b></p>
        <p className="text-sm text-gray-500">Last session: {info.last_session ? `${info.last_session.plant_name}, ${info.last_session.start_moisture}% → ${info.last_session.end_moisture}% in ${info.last_session.duration_sec}s (${info.last_session.mode})` : "none yet"}</p>
      </Card>
      <Card title={`Target moisture · ${p.name}`}>
        <input type="range" className="w-full accent-green-700" min={p.min_moisture} max={p.max_moisture} value={p.target_moisture}
          onChange={(e) => run(() => api.put(`/plants/${p.id}`, { target_moisture: +e.target.value }))} />
        <p className="text-sm text-gray-500">Target {p.target_moisture}% (allowed {p.min_moisture}–{p.max_moisture}%). Edit min/max on the Plant Management page.</p>
      </Card>
      <Card title="Demo helper"><p className="text-sm text-gray-500 mb-3">Simulate a dry spell to watch automatic irrigation react.</p>
        <button className="btn-ghost" onClick={() => run(() => api.post("/simulation/moisture", { value: Math.max(p.min_moisture - 12, 5) }), "Soil moisture dropped")}><CloudOff size={16} />Simulate dry soil</button>
        <div className="mt-3"><Badge s={s.status} /></div></Card>
    </div>
  );
}
