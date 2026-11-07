import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../services/api.js";
import { Card, Spinner, Empty } from "../components/ui.jsx";

export default function History({ toast }) {
  const [rows, setRows] = useState(null), [q, setQ] = useState(""), [mode, setMode] = useState("");
  useEffect(() => { api.get(`/irrigation/history?q=${encodeURIComponent(q)}&mode=${mode}`).then(setRows).catch((e) => toast(e.message, "warning")); }, [q, mode, toast]);
  return (
    <Card>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48"><Search size={16} className="absolute left-3 top-2.5 text-gray-400" /><input className="input pl-9" placeholder="Search by plant" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input w-44" value={mode} onChange={(e) => setMode(e.target.value)}><option value="">All modes</option><option>Automatic</option><option>Manual</option></select>
      </div>
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty text="No irrigation sessions match. Sessions appear here after the pump runs." /> :
        <div className="overflow-x-auto"><table className="w-full text-sm whitespace-nowrap">
          <thead><tr className="text-left text-gray-500">{["Plant", "Start", "End", "Start %", "End %", "Duration", "Water", "Mode"].map((h) => <th key={h} className="py-2 pr-4">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="border-t border-gray-100"><td className="py-2 pr-4 font-medium">{r.plant_name}</td><td className="pr-4">{r.start_time}</td><td className="pr-4">{r.end_time}</td>
            <td className="pr-4">{r.start_moisture}</td><td className="pr-4">{r.end_moisture}</td><td className="pr-4">{r.duration_sec}s</td><td className="pr-4">{r.water_litres} L</td>
            <td><span className={`px-2 py-0.5 rounded-full text-xs ${r.mode === "Manual" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>{r.mode}</span></td></tr>)}</tbody></table></div>}
    </Card>
  );
}
