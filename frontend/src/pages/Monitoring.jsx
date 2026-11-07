import { Card, Gauge, Badge, Tag } from "../components/ui.jsx";

export default function Monitoring({ dash }) {
  const { state: s, plant: p } = dash;
  const range = p && [p.min_moisture, p.max_moisture];
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap"><Badge s={s.status} />{s.pump_on && <Badge s="Irrigation Active" />}<Tag /><span className="text-xs text-gray-400">Last updated {s.last_update || "—"}</span></div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Soil moisture" className="grid place-items-center"><Gauge value={s.moisture} label="Moisture" ideal={range} size={220} color={s.status === "Dry Soil" ? "#C62828" : s.status === "High Moisture" ? "#EF6C00" : "#2E7D32"} /></Card>
        <Card title="Temperature" className="grid place-items-center"><Gauge value={s.temperature} max={50} unit="°C" label="Temperature" color="#E65100" size={220} /></Card>
        <Card title="Humidity" className="grid place-items-center"><Gauge value={s.humidity} label="Humidity" color="#0277BD" size={220} /></Card>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Selected plant">{p && <div className="flex gap-4 items-center"><span className="text-5xl">{p.emoji}</span><div><p className="font-bold text-lg">{p.name}</p>
          <p className="text-sm text-gray-500">Ideal range {range[0]}–{range[1]}% · actual {s.moisture}%</p>
          <div className="relative h-3 w-64 max-w-full bg-gray-100 rounded-full mt-3"><div className="absolute h-3 bg-green-300 rounded-full" style={{ left: `${range[0]}%`, width: `${range[1] - range[0]}%` }} />
            <div className="absolute -top-1 h-5 w-1.5 bg-brand rounded transition-all duration-700" style={{ left: `${s.moisture}%` }} /></div></div></div>}</Card>
        <Card title="Virtual pump"><p className="text-3xl font-extrabold">{s.pump_on ? "ON" : "OFF"}</p><p className="text-sm text-gray-500">{s.pump_on ? `${s.pump_mode} · ${s.session?.elapsed ?? 0}s running` : s.running ? "Standing by" : "Disabled while paused"}</p></Card>
      </div>
    </div>
  );
}
