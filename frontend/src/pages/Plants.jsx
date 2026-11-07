import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { api } from "../services/api.js";
import { Card, Badge, Modal, Spinner } from "../components/ui.jsx";

const BLANK = { name: "", emoji: "🌱", water_need: "Medium", min_moisture: 40, max_moisture: 60, target_moisture: 50, description: "" };

export default function Plants({ refresh, toast }) {
  const [plants, setPlants] = useState(null), [form, setForm] = useState(null), [view, setView] = useState(null);
  const load = useCallback(async () => { try { setPlants(await api.get("/plants")); } catch (e) { toast(e.message, "warning"); } }, [toast]);
  useEffect(() => { load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [load]);
  const act = async (fn, ok) => { try { await fn(); toast(ok, "success"); setForm(null); setView(null); load(); refresh(); } catch (e) { toast(e.message, "warning"); } };
  const save = () => act(() => (form.id ? api.put(`/plants/${form.id}`, form) : api.post("/plants", form)), form.id ? "Plant updated" : "Plant added");
  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });
  if (!plants) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><p className="text-sm text-gray-500">Thresholds are illustrative demo values; real needs depend on soil, climate and growing conditions.</p>
        <button className="btn-primary" onClick={() => setForm(BLANK)}><Plus size={16} />Add plant</button></div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {plants.map((p) => (
          <Card key={p.id} className={p.selected ? "ring-2 ring-brand" : ""}>
            <button className="w-full text-left" onClick={() => setView(p)}>
              <div className="flex items-center gap-3"><span className="text-5xl">{p.emoji}</span><div className="flex-1"><p className="font-bold text-lg">{p.name}</p><p className="text-xs text-gray-500">{p.water_need} water need</p></div><Badge s={p.status} /></div>
              <p className="text-sm mt-3">Ideal <b>{p.min_moisture}–{p.max_moisture}%</b> · now <b>{p.current_moisture}%</b></p>
            </button>
            <div className="flex gap-2 mt-4">
              <button className={p.selected ? "btn-ghost flex-1" : "btn-primary flex-1"} disabled={p.selected} onClick={() => act(() => api.put("/settings", { selected_plant_id: p.id }), `${p.name} selected`)}>{p.selected ? <><Check size={16} />Selected</> : "Select"}</button>
              <button className="btn-ghost" aria-label="Edit" onClick={() => setForm(p)}><Pencil size={16} /></button>
              <button className="btn-danger" aria-label="Delete" onClick={() => confirm(`Delete ${p.name}?`) && act(() => api.del(`/plants/${p.id}`), "Plant deleted")}><Trash2 size={16} /></button>
            </div>
          </Card>))}
      </div>
      {view && <Modal title={`${view.emoji} ${view.name}`} onClose={() => setView(null)}>
        <p className="text-sm text-gray-600 mb-3">{view.description || "No description."}</p>
        <dl className="grid grid-cols-2 gap-2 text-sm"><dt>Water need</dt><dd className="font-semibold">{view.water_need}</dd><dt>Minimum</dt><dd className="font-semibold">{view.min_moisture}%</dd>
          <dt>Maximum</dt><dd className="font-semibold">{view.max_moisture}%</dd><dt>Target</dt><dd className="font-semibold">{view.target_moisture}%</dd><dt>Current</dt><dd className="font-semibold">{view.current_moisture}%</dd></dl></Modal>}
      {form && <Modal title={form.id ? "Edit plant" : "Add plant"} onClose={() => setForm(null)}>
        <div className="space-y-3">
          <div className="flex gap-2"><input className="input w-20 text-center" aria-label="Emoji" {...f("emoji")} /><input className="input" placeholder="Plant name" {...f("name")} /></div>
          <select className="input" {...f("water_need")}><option>Low</option><option>Medium</option><option>High</option></select>
          <div className="grid grid-cols-3 gap-2">{[["min_moisture", "Min %"], ["target_moisture", "Target %"], ["max_moisture", "Max %"]].map(([k, l]) => <label key={k} className="text-xs text-gray-500">{l}<input type="number" min="0" max="100" className="input" {...f(k)} /></label>)}</div>
          <textarea className="input" rows="2" placeholder="Description" {...f("description")} />
          <button className="btn-primary w-full" onClick={save}>Save plant</button></div></Modal>}
    </div>
  );
}
