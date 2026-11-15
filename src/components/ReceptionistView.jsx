import { useState } from 'react';
import { UserPlus, Edit3, UserX, UserCheck, Car, PlusCircle, KeyRound } from 'lucide-react';

export default function ReceptionistView({
  clients,
  vehicles,
  onSaveClient,
  onToggleClientStatus,
  onCreateVehicle
}) {
  const [editingClient, setEditingClient] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [clientForm, setClientForm] = useState({
    nombre_completo: '',
    dni: '',
    telefono: '',
    email: ''
  });
  const [vehicleForm, setVehicleForm] = useState({
    cliente_id: '',
    patente: '',
    vin: '',
    marca: '',
    modelo: '',
    motorizacion: '',
    kilometraje: ''
  });

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    await onSaveClient(clientForm, editingClient?.id);
    if (!editingClient) {
      setStatusMsg(
        `Cliente registrado. Ya puede iniciar sesión con ${clientForm.email} y su DNI (${clientForm.dni}) como contraseña.`
      );
    } else {
      setStatusMsg('Datos del cliente actualizados correctamente.');
    }
    setEditingClient(null);
    setClientForm({ nombre_completo: '', dni: '', telefono: '', email: '' });
  };

  const startEdit = (client) => {
    setEditingClient(client);
    setClientForm({
      nombre_completo: client.nombre_completo,
      dni: client.dni,
      telefono: client.telefono,
      email: client.email
    });
  };

  const handleVehicleSubmit = (e) => {
    e.preventDefault();
    const targetClientId = vehicleForm.cliente_id || clients[0]?.id;
    if (!targetClientId) return;
    onCreateVehicle({
      ...vehicleForm,
      cliente_id: targetClientId,
      patente: vehicleForm.patente.toUpperCase().trim(),
      kilometraje: Number(vehicleForm.kilometraje) || 0
    });
    setVehicleForm({
      ...vehicleForm,
      patente: '',
      vin: '',
      marca: '',
      modelo: '',
      motorizacion: '',
      kilometraje: ''
    });
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div className="bg-emerald-950/90 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            {statusMsg}
          </span>
          <button onClick={() => setStatusMsg('')} className="text-xs underline">Cerrar</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={handleClientSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 h-fit">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            {editingClient ? 'Modificar Titular' : 'Alta de Cliente en Taller'}
          </h2>
          <input
            type="text"
            placeholder="Nombre y Apellido"
            value={clientForm.nombre_completo}
            onChange={(e) => setClientForm({ ...clientForm, nombre_completo: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            required
          />
          <input
            type="text"
            placeholder="N° de Documento (será su contraseña inicial)"
            value={clientForm.dni}
            onChange={(e) => setClientForm({ ...clientForm, dni: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono"
            required
          />
          <input
            type="text"
            placeholder="Teléfono de contacto"
            value={clientForm.telefono}
            onChange={(e) => setClientForm({ ...clientForm, telefono: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            required
          />
          <input
            type="email"
            placeholder="Correo electrónico (usuario de login)"
            value={clientForm.email}
            onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-sm"
            >
              {editingClient ? 'Guardar Cambios' : 'Registrar y Habilitar Acceso'}
            </button>
            {editingClient && (
              <button
                type="button"
                onClick={() => {
                  setEditingClient(null);
                  setClientForm({ nombre_completo: '', dni: '', telefono: '', email: '' });
                }}
                className="bg-slate-800 text-slate-300 px-3 rounded-lg text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <form onSubmit={handleVehicleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3 h-fit">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            Vincular Vehículo a Cliente
          </h2>
          <select
            value={vehicleForm.cliente_id}
            onChange={(e) => setVehicleForm({ ...vehicleForm, cliente_id: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
          >
            <option value="">Seleccionar titular...</option>
            {clients.filter((c) => c.activo).map((c) => (
              <option key={c.id} value={c.id}>{c.nombre_completo} (DNI: {c.dni})</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Patente (Ej: AF123BC)"
              value={vehicleForm.patente}
              onChange={(e) => setVehicleForm({ ...vehicleForm, patente: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white uppercase font-mono"
              required
            />
            <input
              type="number"
              placeholder="Kilometraje actual"
              value={vehicleForm.kilometraje}
              onChange={(e) => setVehicleForm({ ...vehicleForm, kilometraje: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              required
            />
          </div>
          <input
            type="text"
            placeholder="N° de Chasis / VIN"
            value={vehicleForm.vin}
            onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Marca"
              value={vehicleForm.marca}
              onChange={(e) => setVehicleForm({ ...vehicleForm, marca: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              required
            />
            <input
              type="text"
              placeholder="Modelo"
              value={vehicleForm.modelo}
              onChange={(e) => setVehicleForm({ ...vehicleForm, modelo: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              required
            />
          </div>
          <input
            type="text"
            placeholder="Motorización (Ej: 2.8L TDI)"
            value={vehicleForm.motorizacion}
            onChange={(e) => setVehicleForm({ ...vehicleForm, motorizacion: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            required
          />
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-sm"
          >
            Vincular Unidad al Titular
          </button>
        </form>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <h2 className="text-white font-bold text-base">Credenciales Automáticas</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Al dar de alta un cliente en recepción, el sistema crea su cuenta de acceso utilizando su <strong>correo electrónico</strong> y adjudica su <strong>DNI como contraseña inicial</strong>. Luego el cliente puede actualizarla desde su perfil.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-xs text-slate-400">Clientes Activos</span>
              <p className="text-2xl font-extrabold text-white mt-1">
                {clients.filter((c) => c.activo).length}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-xs text-slate-400">Unidades Vinculadas</span>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{vehicles.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-bold text-base mb-4">Padrón de Clientes y Flota Vinculada</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {clients.map((client) => {
            const clientVehicles = vehicles.filter((v) => v.cliente_id === client.id);
            return (
              <div
                key={client.id}
                className={`border rounded-xl p-4 flex flex-col justify-between ${
                  client.activo ? 'bg-slate-950 border-slate-800' : 'bg-slate-950/40 border-red-900/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-base">{client.nombre_completo}</h4>
                      <p className="text-xs text-slate-400">
                        DNI (Clave inicial): <span className="font-mono text-slate-200">{client.dni}</span> • Tel: {client.telefono}
                      </p>
                      <p className="text-xs text-amber-400 font-mono">{client.email}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      client.activo ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                    }`}>
                      {client.activo ? 'Activo' : 'Dado de baja'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                      Vehículos vinculados ({clientVehicles.length}):
                    </p>
                    {clientVehicles.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Sin vehículos registrados</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {clientVehicles.map((v) => (
                          <span
                            key={v.id}
                            className="text-xs bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-md font-mono text-amber-300"
                          >
                            {v.patente} — {v.marca} {v.modelo} ({v.kilometraje.toLocaleString()} km)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end gap-2">
                  <button
                    onClick={() => startEdit(client)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modificar
                  </button>
                  <button
                    onClick={() => onToggleClientStatus(client.id, !client.activo)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      client.activo
                        ? 'bg-red-950/80 hover:bg-red-900 text-red-200'
                        : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-200'
                    }`}
                  >
                    {client.activo ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    {client.activo ? 'Dar de Baja' : 'Reactivar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}