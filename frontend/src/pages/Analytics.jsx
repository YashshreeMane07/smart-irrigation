import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api } from "../services/api.js";
import { Card, Spinner, Empty } from "../components/ui.jsx";
import { Trend, Bars } from "../charts/Charts.jsx";

const RANGES = [["today", "Today"], ["7d", "Last 7 days"], ["30d", "Last 30 days"]];
export default function Analytics({ toast }) {
  const [range, setRange] = useState("today"), [d, setD] = useState(null);
  useEffect(() => { setD(null); api.get(`/analytics?range=${range}`).then(setD).catch((e) => toast(e.message, "warning")); }, [range, toast]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {RANGES.map(([k, l]) => <button key={k} className={range === k ? "btn-primary" : "btn-ghost"} onClick={() => setRange(k)}>{l}</button>)}
        <a className="btn-ghost ml-auto" href={`/api/report/csv?range=${range}`}><Download size={16} />Download report (CSV)</a>
      </div>
      {!d ? <Spinner /> : <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[["Avg soil moisture", d.avg_moisture != null ? `${d.avg_moisture}%` : "—"], ["Total water", `${d.total_water} L`], ["Irrigation sessions", d.irrigation_count], ["Avg temperature", d.avg_temperature != null ? `${d.avg_temperature}°C` : "—"]]
            .map(([l, v]) => <Card key={l} className="!p-4"><p className="text-xs text-gray-500">{l}</p><p className="text-2xl font-bold">{v}</p></Card>)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title="Soil moisture trend"><Trend data={d.series} x="bucket" unit="%" lines={[{ key: "moisture", name: "Moisture", color: "#2E7D32" }]} /></Card>
          <Card title="Temperature trend"><Trend data={d.series} x="bucket" unit="°C" lines={[{ key: "temperature", name: "Temperature", color: "#E65100" }]} /></Card>
          <Card title="Humidity trend"><Trend data={d.series} x="bucket" unit="%" lines={[{ key: "humidity", name: "Humidity", color: "#0277BD" }]} /></Card>
          <Card title="Water by plant"><Bars data={d.per_plant} x="plant_name" y="litres" name="Litres" /></Card>
        </div>
        <Card title="Plant-wise irrigation statistics">{d.per_plant.length === 0 ? <Empty text="No irrigation sessions in this period." /> :
          <table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th className="py-2">Plant</th><th>Sessions</th><th>Water (L)</th><th>Avg duration (s)</th></tr></thead>
            <tbody>{d.per_plant.map((r) => <tr key={r.plant_name} className="border-t border-gray-100"><td className="py-2">{r.plant_name}</td><td>{r.sessions}</td><td>{r.litres}</td><td>{r.avg_duration}</td></tr>)}</tbody></table>}</Card>
      </>}
    </div>
  );
}
