import { X } from 'lucide-react';

export default function SchematicModal({ vehicle, onClose }) {
  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">
              {vehicle.titulo_esquema} — {vehicle.marca} {vehicle.modelo} ({vehicle.patente})
            </h3>
            <p className="text-xs text-slate-400">Manual técnico y esquema eléctrico de consulta rápida</p>
          </div>
          <button onClick={onClose} className="bg-slate-800 p-2 rounded-lg text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
          <svg viewBox="0 0 600 220" className="w-full h-56 stroke-amber-400 fill-none" strokeWidth="2">
            <rect x="20" y="40" width="130" height="140" rx="8" className="stroke-emerald-400" />
            <text x="40" y="75" className="fill-emerald-400 text-xs font-mono" stroke="none">ECU MOTOR</text>
            <text x="40" y="95" className="fill-slate-400 text-xs font-mono" stroke="none">{vehicle.motorizacion}</text>

            <line x1="150" y1="70" x2="290" y2="70" />
            <line x1="150" y1="110" x2="290" y2="110" />
            <line x1="150" y1="150" x2="290" y2="150" />

            <rect x="290" y="45" width="120" height="45" rx="6" />
            <text x="305" y="72" className="fill-amber-300 text-xs font-mono" stroke="none">Relé Bomba 12V</text>

            <rect x="290" y="125" width="120" height="45" rx="6" />
            <text x="305" y="152" className="fill-amber-300 text-xs font-mono" stroke="none">Sensor CKP/CMP</text>

            <line x1="410" y1="68" x2="470" y2="68" />
            <rect x="470" y="45" width="110" height="125" rx="8" className="stroke-sky-400" />
            <text x="485" y="110" className="fill-sky-300 text-xs font-mono" stroke="none">Riel Inyectores</text>
          </svg>
        </div>
      </div>
    </div>
  );
}