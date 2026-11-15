import { useState } from 'react';
import { Search, Wrench, FileText, CheckCircle2, Clock, PlusCircle, Car, AlertCircle } from 'lucide-react';
import {
  sanitizePlate,
  sanitizeVin,
  sanitizeOnlyDigits,
  sanitizeTextSpec,
  validateVehicleData,
  validateWorkOrderData
} from '../services/validators';

export default function MechanicView({
  currentUser,
  vehicles,
  clients,
  orders,
  onCreateVehicle,
  onUpdateVehicleMileage,
  onCreateOrder,
  onUpdateOrder,
  onOpenSchematic,
  onRouteChange
}) {
  const [activeSubTab, setActiveSubTab] = useState('sector_tasks');
  const [searchPlate, setSearchPlate] = useState('');
  const [sectorFilter, setSectorFilter] = useState(currentUser.sector || 'TODOS');
  const [errorMsg, setErrorMsg] = useState('');

  const [vehicleForm, setVehicleForm] = useState({
    cliente_id: '',
    patente: '',
    vin: '',
    marca: '',
    modelo: '',
    motorizacion: '',
    kilometraje: ''
  });

  const [otForm, setOtForm] = useState({
    vehiculo_id: '',
    sector: currentUser.sector || 'Foso / Tren Delantero',
    diagnostico: '',
    reparaciones_asignadas: ''
  });

  const [editingOtId, setEditingOtId] = useState(null);
  const [editDiagnosis, setEditDiagnosis] = useState('');

  const filteredVehicles = vehicles.filter((v) =>
    v.patente.toUpperCase().includes(searchPlate.trim().toUpperCase())
  );

  const filteredOrders = orders.filter(
    (o) => sectorFilter === 'TODOS' || o.sector === sectorFilter
  );

  const switchTab = (tab, endpoint) => {
    setErrorMsg('');
    setActiveSubTab(tab);
    onRouteChange(endpoint);
  };

  const handleCreateVehicleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const payload = {
      ...vehicleForm,
      cliente_id: vehicleForm.cliente_id || clients[0]?.id || ''
    };

    const validationError = validateVehicleData(payload, vehicles);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    onCreateVehicle({
      ...payload,
      patente: payload.patente.toUpperCase().trim(),
      vin: payload.vin.toUpperCase().trim(),
      kilometraje: Number(payload.kilometraje) || 0
    });
    setVehicleForm({ cliente_id: '', patente: '', vin: '', marca: '', modelo: '', motorizacion: '', kilometraje: '' });
  };

  const handleCreateOtSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const targetVehicle = otForm.vehiculo_id || vehicles[0]?.id || '';
    const validationError = validateWorkOrderData({
      vehiculo_id: targetVehicle,
      diagnostico: otForm.diagnostico
    });

    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    onCreateOrder({
      vehiculo_id: targetVehicle,
      sector: otForm.sector,
      diagnostico: otForm.diagnostico.trim(),
      reparaciones_asignadas: otForm.reparaciones_asignadas.trim(),
      costo_mano_obra: 0,
      repuestos_utilizados: []
    });
    setOtForm({ ...otForm, diagnostico: '', reparaciones_asignadas: '' });
  };

  const saveDiagnosisEdit = (otId) => {
    if (editDiagnosis.trim().length < 10) {
      setErrorMsg('El diagnóstico debe tener al menos 10 caracteres.');
      return;
    }
    setErrorMsg('');
    onUpdateOrder(otId, { diagnostico: editDiagnosis.trim() });
    setEditingOtId(null);
  };

  const handleMileageUpdatePrompt = (vehicle) => {
    const raw = prompt(`Actualizar kilometraje actual para ${vehicle.patente} (mínimo ${vehicle.kilometraje} km):`, vehicle.kilometraje);
    if (raw === null) return;
    const cleaned = raw.replace(/\D/g, '');
    const newKm = Number(cleaned);
    if (!cleaned || isNaN(newKm) || newKm < vehicle.kilometraje || newKm > 2000000) {
      setErrorMsg(`Kilometraje inválido: debe ser numérico, entre ${vehicle.kilometraje.toLocaleString()} y 2.000.000 km.`);
      return;
    }
    setErrorMsg('');
    onUpdateVehicleMileage(vehicle.id, newKm);
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

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => switchTab('sector_tasks', '/taller/foso-y-ordenes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm ${
            activeSubTab === 'sector_tasks' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Órdenes de Trabajo y Sector
        </button>
        <button
          onClick={() => switchTab('vehicles_specs', '/taller/fichas-tecnicas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm ${
            activeSubTab === 'vehicles_specs' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
          }`}
        >
          <Car className="w-4 h-4" />
          Vehículos en Taller y Fichas Técnicas
        </button>
      </div>

      {activeSubTab === 'sector_tasks' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-xs font-bold uppercase text-slate-400">Sector Operativo:</span>
              <div className="flex flex-wrap gap-2">
                {['TODOS', 'Foso / Tren Delantero', 'Inyección Electrónica', 'Motor y Distribución'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSectorFilter(sec)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                      sectorFilter === sec ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.map((ot) => {
              const vehicle = vehicles.find((v) => v.id === ot.vehiculo_id);
              return (
                <div key={ot.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-500 text-slate-950 font-mono font-extrabold px-3 py-1 rounded text-base">
                        {vehicle?.patente || 'S/D'}
                      </span>
                      <div>
                        <h3 className="text-white font-bold">{vehicle?.marca} {vehicle?.modelo}</h3>
                        <p className="text-xs text-slate-400">
                          Motor: {vehicle?.motorizacion} • {vehicle?.kilometraje?.toLocaleString()} km • Sector: {ot.sector}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      ot.estado === 'finalizada' ? 'bg-emerald-900 text-emerald-300' :
                      ot.estado === 'en_foso' ? 'bg-amber-900 text-amber-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {ot.estado.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase">Diagnóstico Técnico</span>
                      <button
                        onClick={() => {
                          setEditingOtId(ot.id);
                          setEditDiagnosis(ot.diagnostico);
                        }}
                        className="text-xs text-amber-400 hover:underline font-semibold"
                      >
                        Modificar diagnóstico
                      </button>
                    </div>
                    {editingOtId === ot.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editDiagnosis}
                          onChange={(e) => setEditDiagnosis(e.target.value.slice(0, 500))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                          rows={2}
                        />
                        <button
                          onClick={() => saveDiagnosisEdit(ot.id)}
                          className="bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded text-xs"
                        >
                          Guardar Diagnóstico
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-200">{ot.diagnostico}</p>
                    )}

                    {ot.reparaciones_asignadas && (
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-xs font-bold text-amber-400 uppercase">Reparaciones Asignadas:</span>
                        <p className="text-sm text-slate-200 mt-0.5">{ot.reparaciones_asignadas}</p>
                      </div>
                    )}

                    {ot.repuestos_utilizados?.length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase">Repuestos Asignados:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {ot.repuestos_utilizados.map((p, idx) => (
                            <span key={idx} className="text-xs bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-slate-300">
                              {p.nombre} (Vida útil: {p.vida_util_meses || 12} meses)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => onUpdateOrder(ot.id, { estado: 'en_foso' })}
                      className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl text-sm"
                    >
                      <Clock className="w-5 h-5" />
                      TOMAR EN FOSO
                    </button>
                    <button
                      onClick={() => onUpdateOrder(ot.id, { estado: 'finalizada' })}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      FINALIZAR TAREA
                    </button>
                    {vehicle && (
                      <button
                        onClick={() => onOpenSchematic(vehicle)}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-3.5 rounded-xl text-sm"
                      >
                        <FileText className="w-5 h-5" />
                        MANUAL / ESQUEMA
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateOtSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 h-fit">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              Abrir Nueva Orden de Trabajo
            </h2>
            <select
              value={otForm.vehiculo_id}
              onChange={(e) => setOtForm({ ...otForm, vehiculo_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            >
              <option value="">Seleccionar vehículo...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo}</option>
              ))}
            </select>
            <select
              value={otForm.sector}
              onChange={(e) => setOtForm({ ...otForm, sector: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            >
              <option>Foso / Tren Delantero</option>
              <option>Inyección Electrónica</option>
              <option>Motor y Distribución</option>
            </select>
            <textarea
              placeholder="Diagnóstico inicial relevado (mín. 10 caracteres)..."
              value={otForm.diagnostico}
              onChange={(e) => setOtForm({ ...otForm, diagnostico: e.target.value.slice(0, 500) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              rows={3}
              required
            />
            <textarea
              placeholder="Tareas o reparaciones a efectuar..."
              value={otForm.reparaciones_asignadas}
              onChange={(e) => setOtForm({ ...otForm, reparaciones_asignadas: e.target.value.slice(0, 500) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              rows={2}
            />
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-lg text-sm"
            >
              Registrar Orden de Trabajo
            </button>
          </form>
        </div>
      )}

      {activeSubTab === 'vehicles_specs' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <label className="text-xs uppercase font-bold text-slate-400">
                Buscar Patente para Especificaciones Técnicas y Manuales
              </label>
              <div className="relative mt-2">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(sanitizePlate(e.target.value))}
                  placeholder="Ingresar dominio (Ej: AF123BC)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {filteredVehicles.map((v) => (
                <div key={v.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-500 text-slate-950 font-mono font-extrabold px-3 py-1 rounded">
                      {v.patente}
                    </span>
                    <button
                      onClick={() => handleMileageUpdatePrompt(v)}
                      className="text-xs text-amber-400 hover:underline font-mono"
                    >
                      {v.kilometraje.toLocaleString()} km (Actualizar)
                    </button>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{v.marca} {v.modelo}</h3>
                    <p className="text-xs text-slate-400 font-mono">VIN/Chasis: {v.vin}</p>
                    <p className="text-xs text-slate-300 mt-1">Motorización: <span className="font-semibold">{v.motorizacion}</span></p>
                  </div>
                  <button
                    onClick={() => onOpenSchematic(v)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold py-2.5 rounded-lg text-xs"
                  >
                    <FileText className="w-4 h-4" />
                    Consultar Esquema Eléctrico y Manual
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateVehicleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 h-fit">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              Cargar Ficha Técnica Estándar
            </h2>
            <select
              value={vehicleForm.cliente_id}
              onChange={(e) => setVehicleForm({ ...vehicleForm, cliente_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            >
              <option value="">Titular del vehículo...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre_completo}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Dominio / Patente (AF123BC / ABC123)"
              value={vehicleForm.patente}
              onChange={(e) => setVehicleForm({ ...vehicleForm, patente: sanitizePlate(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white uppercase font-mono"
              required
            />
            <input
              type="text"
              placeholder="VIN / Chasis (8-17 caract. sin I, O, Q)"
              value={vehicleForm.vin}
              onChange={(e) => setVehicleForm({ ...vehicleForm, vin: sanitizeVin(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono uppercase"
              required
            />
            <input
              type="text"
              placeholder="Marca"
              value={vehicleForm.marca}
              onChange={(e) => setVehicleForm({ ...vehicleForm, marca: sanitizeTextSpec(e.target.value, 30) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              required
            />
            <input
              type="text"
              placeholder="Modelo"
              value={vehicleForm.modelo}
              onChange={(e) => setVehicleForm({ ...vehicleForm, modelo: sanitizeTextSpec(e.target.value, 35) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              required
            />
            <input
              type="text"
              placeholder="Motorización"
              value={vehicleForm.motorizacion}
              onChange={(e) => setVehicleForm({ ...vehicleForm, motorizacion: sanitizeTextSpec(e.target.value, 35) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              required
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Kilometraje actual"
              value={vehicleForm.kilometraje}
              onChange={(e) => setVehicleForm({ ...vehicleForm, kilometraje: sanitizeOnlyDigits(e.target.value, 7) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono"
              required
            />
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-lg text-sm"
            >
              Guardar Ficha Técnica
            </button>
          </form>
        </div>
      )}
    </div>
  );
}