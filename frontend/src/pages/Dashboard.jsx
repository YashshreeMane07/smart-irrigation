import { Sprout, Gauge as G, Thermometer, Droplets, Waves, Power } from "lucide-react";
import { Card, Stat, Badge, Tag } from "../components/ui.jsx";
import { Trend, Bars } from "../charts/Charts.jsx";

export default function Dashboard({ dash }) {
  const { state: s, plant: p, last_irrigation: li } = dash;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <Stat icon={Sprout} label="Total plants" value={dash.total_plants} />
        <Stat icon={G} label="Avg soil moisture" value={`${dash.avg_moisture}%`} />
        <Stat icon={Thermometer} label="Temperature" value={`${s.temperature}°C`} />
        <Stat icon={Droplets} label="Air humidity" value={`${s.humidity}%`} />
        <Stat icon={Waves} label="Water used today" value={`${dash.water_today} L`} sub={`${dash.sessions_today} sessions`} />
        <Stat icon={Power} label="Pump" value={s.pump_on ? "ON" : "OFF"} sub={s.running ? s.pump_mode || "Idle" : "Simulation paused"} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Selected plant">
          {p && <div className="flex gap-4 items-center"><div className="text-6xl">{p.emoji}</div><div>
            <p className="text-xl font-bold">{p.name}</p><p className="text-sm text-gray-500">Ideal {p.min_moisture}–{p.max_moisture}% · target {p.target_moisture}%</p>
            <p className="text-sm mt-1">Moisture <b>{s.moisture}%</b></p><div className="mt-2 flex gap-2 items-center"><Badge s={s.status} /><span className="text-xs text-gray-500">{s.health}</span></div></div></div>}
        </Card>
        <Card title="Sensor monitoring" right={<Tag />}>
          <dl className="grid grid-cols-3 text-center gap-2"><div><dt className="text-xs text-gray-500">Moisture</dt><dd className="text-2xl font-bold">{s.moisture}%</dd></div>
            <div><dt className="text-xs text-gray-500">Temp</dt><dd className="text-2xl font-bold">{s.temperature}°</dd></div><div><dt className="text-xs text-gray-500">Humidity</dt><dd className="text-2xl font-bold">{s.humidity}%</dd></div></dl>
          <p className="text-xs text-gray-400 mt-3">Last updated {s.last_update || "—"}</p>
        </Card>
        <Card title="Irrigation status">
          <p className="font-semibold">{s.pump_on ? `Watering (${s.pump_mode})` : s.running ? "Monitoring" : "Paused"}</p>
          <p className="text-sm text-gray-500">Duration: {s.session ? `${s.session.elapsed}s` : "—"}</p>
          <p className="text-sm text-gray-500">Last irrigation: {li ? `${li.end_time} (${li.duration_sec}s, ${li.mode})` : "none yet"}</p>
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Soil moisture over time"><Trend data={dash.readings} x="t" unit="%" ideal={p && [p.min_moisture, p.max_moisture]} lines={[{ key: "moisture", name: "Moisture", color: "#2E7D32" }]} /></Card>
        <Card title="Temperature"><Trend data={dash.readings} x="t" unit="°C" lines={[{ key: "temperature", name: "Temperature", color: "#E65100" }]} /></Card>
        <Card title="Humidity trend"><Trend data={dash.readings} x="t" unit="%" lines={[{ key: "humidity", name: "Humidity", color: "#0277BD" }]} /></Card>
        <Card title="Water consumption (last 7 days)"><Bars data={dash.water_history} x="day" y="litres" name="Litres" /></Card>
      </div>
    </div>
  );
}
