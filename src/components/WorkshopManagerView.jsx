import { useState } from 'react';
import { ClipboardList, Plus, Trash2, Bell, Calendar, AlertCircle } from 'lucide-react';
import {
  sanitizeOnlyDigits,
  sanitizeTextSpec,
  validateWorkOrderData,
  validateSparePart
} from '../services/validators';

export default function WorkshopManagerView({
  orders,
  vehicles,
  alerts,
  onCreateOrder,
  onUpdateOrder
}) {
  const [selectedOt, setSelectedOt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    vehiculo_id: '',
    sector: 'Foso / Tren Delantero',
    diagnostico: '',
    reparaciones_asignadas: '',
    costo_mano_obra: '',
    dias_preventivo: 180
  });
  const [parts, setParts] = useState([]);
  const [partDraft, setPartDraft] = useState({ nombre: '', costo: '', vida_util_meses: 12 });

  const addPartToDraft = () => {
    setErrorMsg('');
    const partError = validateSparePart(partDraft);
    if (partError) {
      setErrorMsg(partError);
      return;
    }

    setParts([
      ...parts,
      {
        nombre: partDraft.nombre.trim(),
        costo: Number(partDraft.costo) || 0,
        vida_util_meses: Number(partDraft.vida_util_meses) || 12
      }
    ]);
    setPartDraft({ nombre: '', costo: '', vida_util_meses: 12 });
  };

  const removePart = (index) => {
    setParts(parts.filter((_, idx) => idx !== index));
  };

  const startAssigningExistingOt = (ot) => {
    setErrorMsg('');
    setSelectedOt(ot);
    setForm({
      vehiculo_id: ot.vehiculo_id,
      sector: ot.sector,
      diagnostico: ot.diagnostico,
      reparaciones_asignadas: ot.reparaciones_asignadas || '',
      costo_mano_obra: ot.costo_mano_obra || 0,
      dias_preventivo: ot.dias_preventivo || 180
    });
    setParts(ot.repuestos_utilizados || []);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const payload = {
      vehiculo_id: form.vehiculo_id || vehicles[0]?.id || '',
      sector: form.sector,
      diagnostico: form.diagnostico.trim(),
      reparaciones_asignadas: form.reparaciones_asignadas.trim(),
      costo_mano_obra: Number(form.costo_mano_obra) || 0,
      repuestos_utilizados: parts,
      dias_preventivo: Number(form.dias_preventivo) || 180
    };

    const validationError = validateWorkOrderData(payload);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    if ((payload.reparaciones_asignadas || '').length < 5) {
      setErrorMsg('Especifica las reparaciones asignadas al mecánico (mínimo 5 caracteres).');
      return;
    }

    if (selectedOt) {
      onUpdateOrder(selectedOt.id, payload);
    } else {
      onCreateOrder(payload);
    }

    setSelectedOt(null);
    setForm({
      vehiculo_id: '',
      sector: 'Foso / Tren Delantero',
      diagnostico: '',
      reparaciones_asignadas: '',
      costo_mano_obra: '',
      dias_preventivo: 180
    });
    setParts([]);
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-950/90 border border-red-700 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg('')} className="text-xs underline ml-4">Cerrar</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 h-fit">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-400" />
            {selectedOt ? 'Asignar Reparaciones y Repuestos a OT' : 'Emitir Nueva Orden de Trabajo'}
          </h2>

          <select
            value={form.vehiculo_id}
            onChange={(e) => setForm({ ...form, vehiculo_id: e.target.value })}
            disabled={!!selectedOt}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
          >
            <option value="">Seleccionar vehículo...</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo}</option>
            ))}
          </select>

          <select
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
          >
            <option>Foso / Tren Delantero</option>
            <option>Inyección Electrónica</option>
            <option>Motor y Distribución</option>
          </select>

          <textarea
            placeholder="Diagnóstico general (mín. 10 caracteres)..."
            value={form.diagnostico}
            onChange={(e) => setForm({ ...form, diagnostico: e.target.value.slice(0, 500) })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            rows={2}
            required
          />

          <textarea
            placeholder="Reparaciones asignadas e instrucciones para el mecánico..."
            value={form.reparaciones_asignadas}
            onChange={(e) => setForm({ ...form, reparaciones_asignadas: e.target.value.slice(0, 500) })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            rows={2}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Mano de Obra ($)</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.costo_mano_obra}
                onChange={(e) => setForm({ ...form, costo_mano_obra: sanitizeOnlyDigits(e.target.value, 8) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Próximo Service (días)</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.dias_preventivo}
                onChange={(e) => setForm({ ...form, dias_preventivo: sanitizeOnlyDigits(e.target.value, 4) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono mt-1"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-2">
            <label className="text-xs font-bold uppercase text-amber-400">Repuestos Utilizados y Vida Útil</label>
            <input
              type="text"
              placeholder="Nombre del repuesto (Ej: Kit Distribución)"
              value={partDraft.nombre}
              onChange={(e) => setPartDraft({ ...partDraft, nombre: sanitizeTextSpec(e.target.value, 50) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Costo ($)"
                value={partDraft.costo}
                onChange={(e) => setPartDraft({ ...partDraft, costo: sanitizeOnlyDigits(e.target.value, 8) })}
                className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Vida útil (1-120 meses)"
                value={partDraft.vida_util_meses}
                onChange={(e) => setPartDraft({ ...partDraft, vida_util_meses: sanitizeOnlyDigits(e.target.value, 3) })}
                className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>
            <button
              type="button"
              onClick={addPartToDraft}
              className="w-full flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-400 py-2 rounded-lg text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Agregar Repuesto a la Orden
            </button>

            {parts.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {parts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-xs">
                    <span>{p.nombre} (${Number(p.costo).toLocaleString()} • {p.vida_util_meses}m)</span>
                    <button type="button" onClick={() => removePart(i)} className="text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-sm"
            >
              {selectedOt ? 'Guardar Asignación' : 'Emitir Orden al Taller'}
            </button>
            {selectedOt && (
              <button
                type="button"
                onClick={() => {
                  setSelectedOt(null);
                  setParts([]);
                }}
                className="bg-slate-800 text-slate-300 px-3 rounded-lg text-xs"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-white font-bold text-base">Órdenes de Trabajo Activas e Históricas</h3>
          {orders.map((ot) => {
            const vehicle = vehicles.find((v) => v.id === ot.vehiculo_id);
            const partsTotal = (ot.repuestos_utilizados || []).reduce((acc, p) => acc + (Number(p.costo) || 0), 0);
            const totalOrder = (Number(ot.costo_mano_obra) || 0) + partsTotal;

            return (
              <div key={ot.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500 text-slate-950 font-mono font-extrabold px-3 py-1 rounded">
                      {vehicle?.patente || 'S/D'}
                    </span>
                    <div>
                      <h4 className="text-white font-bold">{vehicle?.marca} {vehicle?.modelo}</h4>
                      <span className="text-xs text-slate-400">Sector: {ot.sector}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      Total: ${totalOrder.toLocaleString()}
                    </span>
                    <button
                      onClick={() => startAssigningExistingOt(ot)}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                      Asignar Reparaciones / Repuestos
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-300"><strong className="text-slate-400">Diagnóstico:</strong> {ot.diagnostico}</p>
                {ot.reparaciones_asignadas && (
                  <p className="text-sm text-amber-200"><strong className="text-amber-400">Reparación asignada:</strong> {ot.reparaciones_asignadas}</p>
                )}

                {ot.repuestos_utilizados?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ot.repuestos_utilizados.map((p, idx) => (
                      <span key={idx} className="text-xs bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-slate-300">
                        {p.nombre} • ${Number(p.costo || 0).toLocaleString()} • Vida útil: {p.vida_util_meses} meses
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Alertas de Mantenimiento Preventivo Programadas
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {alerts.map((a) => {
                const v = vehicles.find((veh) => veh.id === a.vehiculo_id);
                return (
                  <div key={a.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                    <span className="bg-amber-500 text-slate-950 font-mono font-bold px-2 py-0.5 rounded text-xs">
                      {v?.patente}
                    </span>
                    <p className="text-sm text-white font-semibold mt-1.5">{a.titulo}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Fecha estimada: {a.fecha_vencimiento}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}