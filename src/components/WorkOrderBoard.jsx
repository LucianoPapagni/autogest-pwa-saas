import { useState } from 'react';
import { Wrench, CheckCircle2, Clock, FileText } from 'lucide-react';

export default function WorkOrderBoard({
  orders,
  vehicles,
  onCreateOrder,
  onUpdateStatus,
  onOpenSchematic
}) {
  const [sectorFilter, setSectorFilter] = useState('TODOS');
  const [newOrder, setNewOrder] = useState({
    vehicle_id: vehicles[0]?.id || '',
    sector: 'Foso / Tren Delantero',
    diagnosis: '',
    labor_cost: '',
    part_name: '',
    preventive_days: 180
  });

  const filteredOrders = orders.filter(
    (o) => sectorFilter === 'TODOS' || o.sector === sectorFilter
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newOrder.diagnosis) return;
    onCreateOrder({
      vehicle_id: newOrder.vehicle_id || vehicles[0]?.id,
      sector: newOrder.sector,
      diagnosis: newOrder.diagnosis,
      labor_cost: Number(newOrder.labor_cost) || 0,
      parts_used: newOrder.part_name ? [{ name: newOrder.part_name }] : [],
      preventive_days: Number(newOrder.preventive_days) || 180
    });
    setNewOrder({ ...newOrder, diagnosis: '', labor_cost: '', part_name: '' });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap gap-2">
          {['TODOS', 'Foso / Tren Delantero', 'Inyección Electrónica', 'Motor y Distribución'].map((sec) => (
            <button
              key={sec}
              onClick={() => setSectorFilter(sec)}
              className={`px-4 py-2.5 rounded-lg font-bold text-sm ${
                sectorFilter === sec ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredOrders.map((ot) => {
            const vehicle = vehicles.find((v) => v.id === ot.vehicle_id);
            return (
              <div key={ot.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500 text-slate-950 font-mono font-extrabold px-3 py-1 rounded">
                      {vehicle?.plate || 'S/D'}
                    </span>
                    <span className="text-white font-bold">{vehicle?.brand} {vehicle?.model}</span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded">{ot.sector}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                    ot.status === 'cerrada' ? 'bg-emerald-900 text-emerald-300' :
                    ot.status === 'en_foso' ? 'bg-amber-900 text-amber-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {ot.status}
                  </span>
                </div>

                <p className="text-slate-200 text-sm">{ot.diagnosis}</p>

                {/* Botones táctiles grandes pensados para uso con guantes en foso */}
                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => onUpdateStatus(ot.id, 'en_foso')}
                    className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl text-sm"
                  >
                    <Clock className="w-5 h-5" />
                    EN FOSO
                  </button>
                  <button
                    onClick={() => onUpdateStatus(ot.id, 'cerrada')}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    CERRAR OT
                  </button>
                  {vehicle && (
                    <button
                      onClick={() => onOpenSchematic(vehicle)}
                      className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-3.5 rounded-xl text-sm"
                    >
                      <FileText className="w-5 h-5" />
                      ESQUEMA
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 h-fit">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          Nueva Orden de Trabajo
        </h2>
        <select
          value={newOrder.vehicle_id}
          onChange={(e) => setNewOrder({ ...newOrder, vehicle_id: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
          ))}
        </select>
        <select
          value={newOrder.sector}
          onChange={(e) => setNewOrder({ ...newOrder, sector: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
        >
          <option>Foso / Tren Delantero</option>
          <option>Inyección Electrónica</option>
          <option>Motor y Distribución</option>
        </select>
        <textarea
          placeholder="Diagnóstico y tareas a realizar..."
          value={newOrder.diagnosis}
          onChange={(e) => setNewOrder({ ...newOrder, diagnosis: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
          rows={3}
          required
        />
        <input
          type="text"
          placeholder="Repuesto principal reemplazado"
          value={newOrder.part_name}
          onChange={(e) => setNewOrder({ ...newOrder, part_name: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
        />
        <input
          type="number"
          placeholder="Costo Mano de Obra ($)"
          value={newOrder.labor_cost}
          onChange={(e) => setNewOrder({ ...newOrder, labor_cost: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
        />
        <button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-lg"
        >
          Crear Orden de Trabajo
        </button>
      </form>
    </div>
  );
}