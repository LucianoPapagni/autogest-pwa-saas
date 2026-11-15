import { Wifi, WifiOff, RefreshCw, Wrench, LogOut, Building2 } from 'lucide-react';

const ROLE_LABELS = {
  jefe_taller: 'Jefe de Taller',
  recepcionista: 'Recepción',
  mecanico: 'Mecánico Operario',
  cliente: 'Portal del Propietario'
};

export default function Navbar({
  currentUser,
  currentTenantName,
  currentEndpoint,
  isOffline,
  setIsOffline,
  pendingCount,
  onSyncNow,
  onRefreshData,
  onLogout
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg text-slate-950">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base leading-tight">AutoGest</h1>
              <span className="text-xs bg-slate-800 text-amber-400 border border-slate-700 px-2 py-0.5 rounded font-semibold">
                {ROLE_LABELS[currentUser.rol]}
              </span>
              <span className="hidden sm:inline-block text-xs font-mono bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                {currentEndpoint}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              {currentTenantName} • {currentUser.nombre_completo}
              {currentUser.sector ? ` (${currentUser.sector})` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isOffline && (
            <button
              onClick={onRefreshData}
              title="Actualizar datos desde el servidor"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar
            </button>
          )}

          {currentUser.rol !== 'cliente' && (
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs transition ${
                isOffline ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              {isOffline ? 'Modo Foso (Sin Red)' : 'Conectado'}
            </button>
          )}

          {pendingCount > 0 && (
            <button
              onClick={onSyncNow}
              disabled={isOffline}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Sincronizar ({pendingCount})
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}