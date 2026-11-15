import { useState } from 'react';
import { Wrench, ShieldCheck, UserCheck, HardHat, Car } from 'lucide-react';

const DEMO_USERS = [
  { label: 'Jefe de Taller (Los Andes)', email: 'jefe@losandes.com', pass: '123456', icon: ShieldCheck },
  { label: 'Mecánico de Foso (Los Andes)', email: 'mecanico@losandes.com', pass: '123456', icon: HardHat },
  { label: 'Recepcionista (Los Andes)', email: 'recepcion@losandes.com', pass: '123456', icon: UserCheck },
  { label: 'Cliente (Clave inicial: DNI 31456789)', email: 'cgomez@mail.com', pass: '31456789', icon: Car }
];

export default function LoginScreen({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email.trim().toLowerCase(), password.trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950 border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2.5 rounded-xl text-slate-950">
                <Wrench className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">AutoGest SaaS</h1>
                <p className="text-xs text-slate-400">Gestión Integral de Mantenimiento Vehicular</p>
              </div>
            </div>

            <p className="mt-6 text-sm text-slate-300 leading-relaxed">
              Los clientes dados de alta en recepción ingresan con su correo electrónico y su <strong>número de DNI</strong> como contraseña inicial.
            </p>

            <div className="mt-5 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Perfiles de Prueba Rápida</p>
              {DEMO_USERS.map((u) => {
                const Icon = u.icon;
                return (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => onLogin(u.email, u.pass)}
                    className="w-full flex items-center justify-between bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-2.5 rounded-xl text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-white">{u.label}</p>
                        <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md font-semibold">
                      Ingresar
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Plataforma Multi-Taller con aislamiento seguro de datos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col justify-center space-y-4">
          <h2 className="text-lg font-bold text-white">Acceso al Sistema</h2>
          {error && (
            <div className="bg-red-950/80 border border-red-700 text-red-200 px-3.5 py-2.5 rounded-lg text-xs">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@correo.com"
              className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Contraseña (DNI para clientes nuevos)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña o DNI"
              className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}