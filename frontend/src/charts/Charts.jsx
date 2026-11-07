import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceArea } from "recharts";
import { Empty } from "../components/ui.jsx";

/* lines: [{key, name, color}]; ideal=[lo,hi] shades the plant's ideal band. */
export function Trend({ data, x, lines, unit = "", ideal, height = 240 }) {
  if (!data?.length) return <Empty text="No readings yet. Start the simulation to collect data." />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -10, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE5" />
        <XAxis dataKey={x} tick={{ fontSize: 11 }} minTickGap={30} /><YAxis tick={{ fontSize: 11 }} unit={unit} domain={["auto", "auto"]} />
        <Tooltip formatter={(v) => v + unit} /><Legend />
        {ideal && <ReferenceArea y1={ideal[0]} y2={ideal[1]} fill="#A5D6A7" fillOpacity={0.3} label={{ value: "Ideal", fontSize: 10 }} />}
        {lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} isAnimationActive={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}
export function Bars({ data, x, y, name, height = 240 }) {
  if (!data?.length) return <Empty text="No irrigation sessions in this period." />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -10, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5EBE5" /><XAxis dataKey={x} tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} unit=" L" />
        <Tooltip formatter={(v) => v + " L"} /><Legend /><Bar dataKey={y} name={name} fill="#2E7D32" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
