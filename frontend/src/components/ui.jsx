import { Loader2, X } from "lucide-react";

export const Card = ({ title, right, children, className = "" }) => (
  <section className={`bg-white rounded-2xl border border-green-100 shadow-sm p-5 ${className}`}>
    {(title || right) && <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">{title}</h3>{right}</div>}
    {children}
  </section>
);
export const Stat = ({ icon: I, label, value, sub }) => (
  <Card className="flex items-center gap-4 !p-4">
    <div className="h-11 w-11 shrink-0 rounded-xl bg-brand-light text-brand grid place-items-center"><I size={22} /></div>
    <div className="min-w-0"><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold truncate">{value}</p>{sub && <p className="text-xs text-gray-400">{sub}</p>}</div>
  </Card>
);
const TONE = { "Dry Soil": "bg-red-100 text-red-700", "Optimal Moisture": "bg-green-100 text-green-800", "High Moisture": "bg-amber-100 text-amber-800", "Irrigation Active": "bg-sky-100 text-sky-700" };
export const Badge = ({ s }) => <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TONE[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
export const Spinner = () => <div className="grid place-items-center py-20 text-brand"><Loader2 className="animate-spin" size={32} /></div>;
export const Empty = ({ text }) => <p className="text-center text-sm text-gray-400 py-10">{text}</p>;
export const Tag = () => <span className="text-[11px] font-medium bg-brand-light text-brand px-2 py-0.5 rounded-full">Simulated Sensor Data</span>;
export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">{title}</h3><button onClick={onClose} aria-label="Close"><X /></button></div>{children}
    </div>
  </div>
);
export const Toggle = ({ on, onChange, disabled }) => (
  <button disabled={disabled} onClick={() => onChange(!on)} role="switch" aria-checked={on}
    className={`h-7 w-12 rounded-full p-1 transition ${on ? "bg-brand" : "bg-gray-300"} disabled:opacity-50`}>
    <span className={`block h-5 w-5 rounded-full bg-white transition ${on ? "translate-x-5" : ""}`} />
  </button>
);
/* Circular gauge. `ideal=[lo,hi]` draws the plant's ideal band behind the live value arc. */
export function Gauge({ value, max = 100, unit = "%", label, ideal, color = "#2E7D32", size = 170 }) {
  const r = 70, C = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 180 180" className="w-full h-full">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#EEF2EE" strokeWidth="14" />
        {ideal && <circle cx="90" cy="90" r={r} fill="none" stroke="#A5D6A7" strokeWidth="14" strokeDasharray={`${((ideal[1] - ideal[0]) / max) * C} ${C}`} transform={`rotate(${-90 + (ideal[0] / max) * 360} 90 90)`} />}
        <circle cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${v * C} ${C}`} transform="rotate(-90 90 90)" style={{ transition: "stroke-dasharray .8s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-3xl font-extrabold">{value}<span className="text-base font-semibold">{unit}</span></p><p className="text-xs text-gray-500">{label}</p></div></div>
    </div>
  );
}
