import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { Card, Spinner } from "../components/ui.jsx";

const FIELDS = [["temp_min", "Min temperature (°C)"], ["temp_max", "Max temperature (°C)"], ["hum_min", "Min humidity (%)"], ["hum_max", "Max humidity (%)"], ["interval_sec", "Reading interval (seconds)"]];
export default function Settings({ refresh, toast }) {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/settings").then(setS).catch((e) => toast(e.message, "warning")); }, [toast]);
  if (!s) return <Spinner />;
  const save = async () => {
    try { const body = Object.fromEntries(FIELDS.map(([k]) => [k, +s[k]])); setS(await api.put("/settings", body)); toast("Settings saved", "success"); refresh(); }
    catch (e) { toast(e.message, "warning"); }
  };
  return (
    <Card title="Simulation settings" className="max-w-xl">
      <p className="text-sm text-gray-500 mb-4">Temperature and humidity drift gradually inside these ranges. Pump behaviour is configured on the Irrigation Control page.</p>
      <div className="grid sm:grid-cols-2 gap-3">{FIELDS.map(([k, l]) => <label key={k} className="text-xs text-gray-500">{l}<input type="number" step="any" className="input" value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></label>)}</div>
      <button className="btn-primary mt-5" onClick={save}>Save settings</button>
    </Card>
  );
}
