import { useCallback, useEffect, useState } from 'react';
import { supabase } from './services/supabaseClient';
import {
  enqueueOfflineMutation,
  getPendingMutations,
  clearMutationById
} from './services/offlineSyncQueue';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import ReceptionistView from './components/ReceptionistView';
import MechanicView from './components/MechanicView';
import WorkshopManagerView from './components/WorkshopManagerView';
import ClientPortalView from './components/ClientPortalView';
import SchematicModal from './components/SchematicModal';

const ROLE_DEFAULT_ENDPOINTS = {
  recepcionista: '/recepcion/clientes-y-vehiculos',
  mecanico: '/taller/foso-y-ordenes',
  jefe_taller: '/jefatura/gestion-ordenes',
  cliente: '/portal-cliente/historial-y-alertas'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEndpoint, setCurrentEndpoint] = useState('/acceso');
  const [loginError, setLoginError] = useState('');
  const [tenants, setTenants] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedSchematic, setSelectedSchematic] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const navigateEndpoint = useCallback((path) => {
    setCurrentEndpoint(path);
    window.history.replaceState({}, '', path);
  }, []);

  const refreshQueueCount = useCallback(async () => {
    const list = await getPendingMutations();
    setPendingCount(list.length);
  }, []);

  const loadRoleData = useCallback(async (user) => {
    if (!user || isOffline) return;

    if (user.rol === 'cliente') {
      const { data: clientRows } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', user.email)
        .eq('activo', true);

      if (!clientRows || clientRows.length === 0) {
        setTenants([]);
        setVehicles([]);
        setOrders([]);
        setAlerts([]);
        return;
      }

      const tallerIds = [...new Set(clientRows.map((c) => c.taller_id))];
      const clienteIds = clientRows.map((c) => c.id);

      const [tRes, vRes] = await Promise.all([
        supabase.from('talleres').select('*').in('id', tallerIds),
        supabase.from('vehiculos').select('*').in('cliente_id', clienteIds)
      ]);

      const vehiculoIds = (vRes.data || []).map((v) => v.id);

      const [oRes, aRes] = await Promise.all([
        vehiculoIds.length > 0
          ? supabase.from('ordenes_trabajo').select('*').in('vehiculo_id', vehiculoIds).order('creado_en', { ascending: false })
          : Promise.resolve({ data: [] }),
        vehiculoIds.length > 0
          ? supabase.from('alertas_preventivas').select('*').in('vehiculo_id', vehiculoIds).order('fecha_vencimiento', { ascending: true })
          : Promise.resolve({ data: [] })
      ]);

      setClients(clientRows);
      setTenants(tRes.data || []);
      setVehicles(vRes.data || []);
      setOrders(oRes.data || []);
      setAlerts(aRes.data || []);
    } else {
      const [tRes, cRes, vRes, oRes, aRes] = await Promise.all([
        supabase.from('talleres').select('*').eq('id', user.taller_id),
        supabase.from('clientes').select('*').eq('taller_id', user.taller_id).order('creado_en', { ascending: false }),
        supabase.from('vehiculos').select('*').eq('taller_id', user.taller_id).order('creado_en', { ascending: false }),
        supabase.from('ordenes_trabajo').select('*').eq('taller_id', user.taller_id).order('creado_en', { ascending: false }),
        supabase.from('alertas_preventivas').select('*').eq('taller_id', user.taller_id).order('fecha_vencimiento', { ascending: true })
      ]);

      setTenants(tRes.data || []);
      setClients(cRes.data || []);
      setVehicles(vRes.data || []);
      setOrders(oRes.data || []);
      setAlerts(aRes.data || []);
    }
  }, [isOffline]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      const list = await getPendingMutations();
      if (!ignore) setPendingCount(list.length);
      if (currentUser && !ignore) {
        await loadRoleData(currentUser);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [currentUser, isOffline, loadRoleData]);

  const handleLogin = async (email, password) => {
    setLoginError('');
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (error || !data) {
      setLoginError('Credenciales incorrectas. Si eres cliente nuevo, tu contraseña inicial es tu número de DNI.');
      return;
    }
    setCurrentUser(data);
    navigateEndpoint(ROLE_DEFAULT_ENDPOINTS[data.rol] || '/panel');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigateEndpoint('/acceso');
  };

  const handleSaveClient = async (clientForm, existingId) => {
    const cleanPayload = {
      nombre_completo: clientForm.nombre_completo.trim(),
      dni: clientForm.dni.trim(),
      telefono: clientForm.telefono.trim(),
      email: clientForm.email.trim().toLowerCase()
    };

    if (existingId) {
      await supabase.from('clientes').update(cleanPayload).eq('id', existingId);
    } else {
      await supabase.from('clientes').insert([{ ...cleanPayload, taller_id: currentUser.taller_id, activo: true }]);
    }
    await loadRoleData(currentUser);
  };

  const handleToggleClientStatus = async (clientId, activeStatus) => {
    await supabase.from('clientes').update({ activo: activeStatus }).eq('id', clientId);
    await loadRoleData(currentUser);
  };

  const handleChangePassword = async (newPassword) => {
    await supabase
      .from('usuarios')
      .update({ password: newPassword.trim() })
      .eq('id', currentUser.id);
  };

  const handleCreateVehicle = async (payload) => {
    const record = { ...payload, taller_id: currentUser.taller_id };
    if (isOffline) {
      await enqueueOfflineMutation({ table: 'vehiculos', action: 'INSERT', payload: record });
      setVehicles((prev) => [{ ...record, id: crypto.randomUUID() }, ...prev]);
      await refreshQueueCount();
      return;
    }
    await supabase.from('vehiculos').insert([record]);
    await loadRoleData(currentUser);
  };

  const handleUpdateVehicleMileage = async (vehicleId, kilometraje) => {
    await supabase.from('vehiculos').update({ kilometraje }).eq('id', vehicleId);
    await loadRoleData(currentUser);
  };

  const handleCreateOrder = async (payload) => {
    const record = { ...payload, taller_id: currentUser.taller_id, estado: 'pendiente' };
    if (isOffline) {
      await enqueueOfflineMutation({ table: 'ordenes_trabajo', action: 'INSERT', payload: record });
      setOrders((prev) => [{ ...record, id: crypto.randomUUID(), creado_en: new Date().toISOString() }, ...prev]);
      await refreshQueueCount();
      return;
    }
    await supabase.from('ordenes_trabajo').insert([record]);
    await loadRoleData(currentUser);
  };

  const handleUpdateOrder = async (orderId, changes) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...changes } : o)));
    if (isOffline) {
      await enqueueOfflineMutation({
        table: 'ordenes_trabajo',
        action: 'UPDATE',
        match: { id: orderId },
        payload: changes
      });
      await refreshQueueCount();
      return;
    }
    await supabase.from('ordenes_trabajo').update(changes).eq('id', orderId);
    await loadRoleData(currentUser);
  };

  const handleSyncOfflineQueue = async () => {
    if (isOffline) return;
    const queue = await getPendingMutations();
    for (const item of queue) {
      if (item.action === 'INSERT') {
        await supabase.from(item.table).insert([item.payload]);
      } else if (item.action === 'UPDATE') {
        await supabase.from(item.table).update(item.payload).match(item.match);
      }
      await clearMutationById(item.id);
    }
    await refreshQueueCount();
    await loadRoleData(currentUser);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  const currentTenantName =
    currentUser.rol === 'cliente'
      ? `${tenants.length} Talleres Vinculados`
      : tenants[0]?.nombre || 'Taller Suscriptor';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar
        currentUser={currentUser}
        currentTenantName={currentTenantName}
        currentEndpoint={currentEndpoint}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        pendingCount={pendingCount}
        onSyncNow={handleSyncOfflineQueue}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {currentUser.rol === 'recepcionista' && (
          <ReceptionistView
            clients={clients}
            vehicles={vehicles}
            onSaveClient={handleSaveClient}
            onToggleClientStatus={handleToggleClientStatus}
            onCreateVehicle={handleCreateVehicle}
          />
        )}

        {currentUser.rol === 'mecanico' && (
          <MechanicView
            currentUser={currentUser}
            vehicles={vehicles}
            clients={clients}
            orders={orders}
            onCreateVehicle={handleCreateVehicle}
            onUpdateVehicleMileage={handleUpdateVehicleMileage}
            onCreateOrder={handleCreateOrder}
            onUpdateOrder={handleUpdateOrder}
            onOpenSchematic={setSelectedSchematic}
            onRouteChange={navigateEndpoint}
          />
        )}

        {currentUser.rol === 'jefe_taller' && (
          <WorkshopManagerView
            orders={orders}
            vehicles={vehicles}
            alerts={alerts}
            onCreateOrder={handleCreateOrder}
            onUpdateOrder={handleUpdateOrder}
          />
        )}

        {currentUser.rol === 'cliente' && (
          <ClientPortalView
            myTenants={tenants}
            myVehicles={vehicles}
            myOrders={orders}
            myAlerts={alerts}
            onChangePassword={handleChangePassword}
            onRouteChange={navigateEndpoint}
          />
        )}
      </main>

      <SchematicModal
        vehicle={selectedSchematic}
        onClose={() => setSelectedSchematic(null)}
      />
    </div>
  );
}