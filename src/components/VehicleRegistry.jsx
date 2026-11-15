import { useState } from 'react';
import { Search, PlusCircle, FileText } from 'lucide-react';

export default function VehicleRegistry({ vehicles, clients, onCreateVehicle, onOpenSchematic }) {
  const [searchPlate, setSearchPlate] = useState('');
  const [latencyMs, setLatencyMs] = useState(null);
  const [form, setForm] = useState({
    client_id: clients[0]?.id || '',
    plate: '',
    vin: '',
    brand: '',
    model: '',
    engine: '',
    mileage: ''
  });

  const handleSearch = (value) => {
    const t0 = performance.now();
    setSearchPlate(value.toUpperCase());
    const t1 = performance.now();
    setLatencyMs((t1 - t0).toFixed(2));
  };

  const filtered = vehicles.filter((v) =>
    v.plate.toUpperCase().includes(searchPlate.trim())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.plate || !form.brand) return;
    onCreateVehicle({
      ...form,
      client_id: form.client_id || clients[0]?.id,
      plate: form.plate.toUpperCase().trim(),
      mileage: Number(form.mileage) || 0
    });
    setForm({ ...form, plate: '', vin: '', brand: '', model: '', engine: '', mileage: '' });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <label className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            Buscador Indexado por Dominio / Patente (Objetivo SMART &lt; 2s)
          </label>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchPlate}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Ej: AF123BC..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white font-mono uppercase"
              />
            </div>
            {latencyMs !== null && (
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-3 py-2 rounded-lg font-mono">
                {latencyMs} ms
              </span>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((v) => (
            <div key={v.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="bg-amber-500 text-slate-950 font-mono font-extrabold px-3 py-1 rounded text-base">
                    {v.plate}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{v.mileage.toLocaleString()} km</span>
                </div>
                <h3 className="text-white font-bold text-lg mt-2">{v.brand} {v.model}</h3>
                <p className="text-slate-400 text-sm">Motor: {v.engine} • VIN: {v.vin}</p>
              </div>
              <button
                onClick={() => onOpenSchematic(v)}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold py-2.5 rounded-lg text-sm"
              >
                <FileText className="w-4 h-4" />
                Abrir Esquema Eléctrico
              </button>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 h-fit">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-amber-400" />
          Alta de Vehículo
        </h2>
        <select
          value={form.client_id}
          onChange={(e) => setForm({ ...form, client_id: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
        {['plate', 'vin', 'brand', 'model', 'engine', 'mileage'].map((field) => (
          <input
            key={field}
            type={field === 'mileage' ? 'number' : 'text'}
            placeholder={field.toUpperCase()}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
            required
          />
        ))}
        <button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-lg"
        >
          Guardar en Parque Automotor
        </button>
      </form>
    </div>
  );
}