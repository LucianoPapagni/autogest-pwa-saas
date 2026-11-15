import { useState } from 'react';
import { Bell, History, Building2, Wrench, ShieldCheck, Calendar, KeyRound } from 'lucide-react';

export default function ClientPortalView({
  myTenants,
  myVehicles,
  myOrders,
  myAlerts,
  onChangePassword,
  onRouteChange
}) {
  const [activeTab, setActiveTab] = useState('history');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState('');

  const switchTab = (tab, endpoint) => {
    setActiveTab(tab);
    onRouteChange(endpoint);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordFeedback('');
    if (newPassword.length < 4) {
      setPasswordFeedback('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback('Las contraseñas ingresadas no coinciden.');
      return;
    }
    await onChangePassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordFeedback('¡Contraseña actualizada con éxito! La usarás en tu próximo inicio de sesión.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => switchTab('history', '/portal-cliente/historial-y-alertas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm ${
            activeTab === 'history' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Anuncios e Historial de Mis Vehículos
        </button>
        <button
          onClick={() => switchTab('workshops', '/portal-cliente/talleres-asociados')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm ${
            activeTab === 'workshops' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Mis Talleres Registrados ({myTenants.length})
        </button>
        <button
          onClick={() => switchTab('security', '/portal-cliente/cambiar-clave')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm ${
            activeTab === 'security' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Mi Contraseña
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 space-y-3">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Anuncios y Próximos Mantenimientos de tu Vehículo
            </h2>
            {myAlerts.length === 0 ? (
              <p className="text-sm text-slate-400">No tienes anuncios ni mantenimientos preventivos pendientes.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {myAlerts.map((alert) => {
                  const vehicle = myVehicles.find((v) => v.id === alert.vehiculo_id);
                  const workshop = myTenants.find((t) => t.id === alert.taller_id);
                  return (
                    <div key={alert.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-500 text-slate-950 font-mono font-bold px-2.5 py-0.5 rounded text-xs">
                            {vehicle?.patente}
                          </span>
                          <span className="text-xs text-slate-400">{workshop?.nombre}</span>
                        </div>
                        <h3 className="text-white font-semibold text-sm mt-2">{alert.titulo}</h3>
                        <p className="text-xs text-amber-300 mt-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Fecha recomendada: {alert.fecha_vencimiento}
                        </p>
                      </div>
                      <span className="text-xs bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-full font-bold uppercase">
                        Programado
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              Registro Cronológico de Órdenes de Trabajo, Costos y Vida Útil de Repuestos
            </h2>
            {myOrders.map((ot) => {
              const vehicle = myVehicles.find((v) => v.id === ot.vehiculo_id);
              const workshop = myTenants.find((t) => t.id === ot.taller_id);
              const partsCost = (ot.repuestos_utilizados || []).reduce((sum, p) => sum + (Number(p.costo) || 0), 0);
              const totalCost = (Number(ot.costo_mano_obra) || 0) + partsCost;

              return (
                <div key={ot.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-500 text-slate-950 font-mono font-extrabold px-3 py-1 rounded">
                        {vehicle?.patente}
                      </span>
                      <div>
                        <h3 className="text-white font-bold">{vehicle?.marca} {vehicle?.modelo}</h3>
                        <p className="text-xs text-slate-400">
                          Taller: <strong className="text-slate-200">{workshop?.nombre}</strong> • Fecha: {new Date(ot.creado_en).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      ot.estado === 'finalizada' ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300'
                    }`}>
                      {ot.estado === 'finalizada' ? 'Finalizado' : 'En Taller'}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Diagnóstico</p>
                      <p className="text-slate-200 mt-1">{ot.diagnostico}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">Intervenciones Realizadas</p>
                      <p className="text-slate-200 mt-1">{ot.reparaciones_asignadas || 'En evaluación técnica'}</p>
                    </div>
                  </div>

                  {ot.repuestos_utilizados?.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <p className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Piezas Reemplazadas y Seguimiento de Vida Útil Estimada
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {ot.repuestos_utilizados.map((part, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-xs">
                            <div>
                              <p className="font-semibold text-white">{part.nombre}</p>
                              <p className="text-emerald-400">Vida útil estimada: {part.vida_util_meses || 12} meses</p>
                            </div>
                            <span className="font-mono text-slate-300">${Number(part.costo || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-xs pt-2 text-slate-400">
                    <span>Mano de Obra: <strong className="text-slate-200">${Number(ot.costo_mano_obra || 0).toLocaleString()}</strong></span>
                    <span>Repuestos: <strong className="text-slate-200">${partsCost.toLocaleString()}</strong></span>
                    <span className="text-sm font-bold text-amber-400">Costo Total Asociado: ${totalCost.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'workshops' && (
        <div className="grid md:grid-cols-2 gap-4">
          {myTenants.map((t) => {
            const vehiclesInWorkshop = myVehicles.filter((v) => v.taller_id === t.id);
            return (
              <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg">{t.nombre}</h3>
                  <span className="text-xs bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-full font-semibold">
                    Taller Habilitado
                  </span>
                </div>
                <p className="text-xs text-slate-400">{t.direccion} • Tel: {t.telefono}</p>
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 mb-2">Vehículos registrados en este taller:</p>
                  <div className="flex flex-wrap gap-2">
                    {vehiclesInWorkshop.map((v) => (
                      <span key={v.id} className="text-xs bg-slate-950 border border-slate-700 px-3 py-1 rounded font-mono text-amber-400">
                        {v.patente} — {v.marca} {v.modelo} ({v.kilometraje.toLocaleString()} km)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'security' && (
        <form onSubmit={handlePasswordSubmit} className="max-w-md bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            Cambiar Contraseña de Acceso
          </h2>
          <p className="text-xs text-slate-400">
            Tu contraseña inicial adjudicada por el taller es tu número de documento (DNI). Aquí puedes personalizarla por la que prefieras.
          </p>
          {passwordFeedback && (
            <div className="bg-slate-950 border border-amber-500/50 text-amber-300 p-3 rounded-lg text-xs">
              {passwordFeedback}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ingresa tu nueva clave"
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva clave"
              className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-sm"
          >
            Actualizar Contraseña
          </button>
        </form>
      )}
    </div>
  );
}