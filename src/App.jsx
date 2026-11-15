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

const SESSION_STORAGE_KEY = 'autogest_active_user';
const ENDPOINT_STORAGE_KEY = 'autogest_active_endpoint';

const ROLE_DEFAULT_ENDPOINTS = {
  recepcionista: '/recepcion/clientes-y-vehiculos',
  mecanico: '/taller/foso-y-ordenes',
  jefe_taller: '/jefatura/gestion-ordenes',
  cliente: '/portal-cliente/historial-y-alertas'
};

function getCacheKey(user) {
  return `autogest_cache_${user.id}`;
}

function readLocalCache(user) {
  if (!user) return null;
  try {
    const raw = localStorage.getItem(getCacheKey(user));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalCache(user, data) {
  if (!user) return;
  try {
    localStorage.setItem(getCacheKey(user), JSON.stringify(data));
  } catch {
    // Ignorar si se excede cuota de almacenamiento local
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentEndpoint, setCurrentEndpoint] = useState(() => {
    return localStorage.getItem(ENDPOINT_STORAGE_KEY) || '/acceso';
  });

  const [loginError, setLoginError] = useState('');

  // Inicializar estados directamente desde el caché local del usuario para que estén disponibles sin conexión
  const [tenants, setTenants] = useState(() => readLocalCache(currentUser)?.tenants || []);
  const [clients, setClients] = useState(() => readLocalCache(currentUser)?.clients || []);
  const [vehicles, setVehicles] = useState(() => readLocalCache(currentUser)?.vehicles || []);
  const [orders, setOrders] = useState(() => readLocalCache(currentUser)?.orders || []);
  const [alerts, setAlerts] = useState(() => readLocalCache(currentUser)?.alerts || []);

  const [selectedSchematic, setSelectedSchematic] = useState(null);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const navigateEndpoint = useCallback((path) => {
    setCurrentEndpoint(path);
    localStorage.setItem(ENDPOINT_STORAGE_KEY, path);
    window.history.replaceState({}, '', path);
  }, []);

  const refreshQueueCount = useCallback(async () => {
    const list = await getPendingMutations();
    setPendingCount(list.length);
  }, []);

  // Escuchar cambios reales de conexión Wi-Fi / Datos móviles en el teléfono
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sincronizar el caché local cada vez que cambian los datos en memoria
  useEffect(() => {
    if (!currentUser) return;
    writeLocalCache(currentUser, { tenants, clients, vehicles, orders, alerts });
  }, [currentUser, tenants, clients, vehicles, orders, alerts]);

  const loadRoleData = useCallback(async (user) => {
    if (!user) return;

    // 1. Cargar primero desde caché local por si estamos sin señal al abrir o recargar la PWA
    const cached = readLocalCache(user);
    if (cached) {
      setTenants(cached.tenants || []);
      setClients(cached.clients || []);
      setVehicles(cached.vehicles || []);
      setOrders(cached.orders || []);
      setAlerts(cached.alerts || []);
    }

    if (isOffline || !navigator.onLine) {
      setIsOffline(true);
      return;
    }

    try {
      if (user.rol === 'cliente') {
        const { data: clientRows, error: errCli } = await supabase
          .from('clientes')
          .select('*')
          .eq('email', user.email)
          .eq('activo', true);

        if (errCli) throw errCli;

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

        if (tRes.error) throw tRes.error;
        if (vRes.error) throw vRes.error;

        const vehiculoIds = (vRes.data || []).map((v) => v.id);

        const [oRes, aRes] = await Promise.all([
          vehiculoIds.length > 0
            ? supabase.from('ordenes_trabajo').select('*').in('vehiculo_id', vehiculoIds).order('creado_en', { ascending: false })
            : Promise.resolve({ data: [] }),
          vehiculoIds.length > 0
            ? supabase.from('alertas_preventivas').select('*').in('vehiculo_id', vehiculoIds).order('fecha_vencimiento', { ascending: true })
            : Promise.resolve({ data: [] })
        ]);

        const freshData = {
          clients: clientRows,
          tenants: tRes.data || [],
          vehicles: vRes.data || [],
          orders: oRes.data || [],
          alerts: aRes.data || []
        };

        setClients(freshData.clients);
        setTenants(freshData.tenants);
        setVehicles(freshData.vehicles);
        setOrders(freshData.orders);
        setAlerts(freshData.alerts);
        writeLocalCache(user, freshData);
      } else {
        const [tRes, cRes, vRes, oRes, aRes] = await Promise.all([
          supabase.from('talleres').select('*').eq('id', user.taller_id),
          supabase.from('clientes').select('*').eq('taller_id', user.taller_id).order('creado_en', { ascending: false }),
          supabase.from('vehiculos').select('*').eq('taller_id', user.taller_id).order('creado_en', { ascending: false }),
          supabase.from('ordenes_trabajo').select('*').eq('taller_id', user.taller_id).order('creado_en', { ascending: false }),
          supabase.from('alertas_preventivas').select('*').eq('taller_id', user.taller_id).order('fecha_vencimiento', { ascending: true })
        ]);

        if (tRes.error || cRes.error || vRes.error || oRes.error || aRes.error) {
          throw new Error('Sin conexión con el servidor');
        }

        const freshData = {
          tenants: tRes.data || [],
          clients: cRes.data || [],
          vehicles: vRes.data || [],
          orders: oRes.data || [],
          alerts: aRes.data || []
        };

        setTenants(freshData.tenants);
        setClients(freshData.clients);
        setVehicles(freshData.vehicles);
        setOrders(freshData.orders);
        setAlerts(freshData.alerts);
        writeLocalCache(user, freshData);
      }
    } catch {
      // Si la petición falla por caída silenciosa de red en el celular, pasar a modo Offline manteniendo el caché
      setIsOffline(true);
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
    try {
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

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      setCurrentUser(data);
      const targetEndpoint = ROLE_DEFAULT_ENDPOINTS[data.rol] || '/panel';
      navigateEndpoint(targetEndpoint);
    } catch {
      setLoginError('No hay conexión a internet para validar el inicio de sesión inicial.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(ENDPOINT_STORAGE_KEY);
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
    const optimisticVehicle = {
      ...record,
      id: crypto.randomUUID(),
      titulo_esquema: 'Esquema Eléctrico ECU / Inyección Electrónica',
      creado_en: new Date().toISOString()
    };

    if (isOffline || !navigator.onLine) {
      setIsOffline(true);
      await enqueueOfflineMutation({ table: 'vehiculos', action: 'INSERT', payload: record });
      setVehicles((prev) => [optimisticVehicle, ...prev]);
      await refreshQueueCount();
      return;
    }

    try {
      const { error } = await supabase.from('vehiculos').insert([record]);
      if (error) throw error;
      await loadRoleData(currentUser);
    } catch {
      setIsOffline(true);
      await enqueueOfflineMutation({ table: 'vehiculos', action: 'INSERT', payload: record });
      setVehicles((prev) => [optimisticVehicle, ...prev]);
      await refreshQueueCount();
    }
  };

  const handleUpdateVehicleMileage = async (vehicleId, kilometraje) => {
    setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? { ...v, kilometraje } : v)));

    if (isOffline || !navigator.onLine) {
      setIsOffline(true);
      await enqueueOfflineMutation({
        table: 'vehiculos',
        action: 'UPDATE',
        match: { id: vehicleId },
        payload: { kilometraje }
      });
      await refreshQueueCount();
      return;
    }

    try {
      const { error } = await supabase.from('vehiculos').update({ kilometraje }).eq('id', vehicleId);
      if (error) throw error;
      await loadRoleData(currentUser);
    } catch {
      setIsOffline(true);
      await enqueueOfflineMutation({
        table: 'vehiculos',
        action: 'UPDATE',
        match: { id: vehicleId },
        payload: { kilometraje }
      });
      await refreshQueueCount();
    }
  };

  const handleCreateOrder = async (payload) => {
    const record = { ...payload, taller_id: currentUser.taller_id, estado: 'pendiente' };
    const optimisticOrder = {
      ...record,
      id: crypto.randomUUID(),
      creado_en: new Date().toISOString()
    };

    if (isOffline || !navigator.onLine) {
      setIsOffline(true);
      await enqueueOfflineMutation({ table: 'ordenes_trabajo', action: 'INSERT', payload: record });
      setOrders((prev) => [optimisticOrder, ...prev]);
      await refreshQueueCount();
      return;
    }

    try {
      const { error } = await supabase.from('ordenes_trabajo').insert([record]);
      if (error) throw error;
      await loadRoleData(currentUser);
    } catch {
      // Si se cortó la red con la app abierta, pasar a Modo Foso y encolar en IndexedDB sin perder la OT
      setIsOffline(true);
      await enqueueOfflineMutation({ table: 'ordenes_trabajo', action: 'INSERT', payload: record });
      setOrders((prev) => [optimisticOrder, ...prev]);
      await refreshQueueCount();
    }
  };

  const handleUpdateOrder = async (orderId, changes) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...changes } : o)));

    if (isOffline || !navigator.onLine) {
      setIsOffline(true);
      await enqueueOfflineMutation({
        table: 'ordenes_trabajo',
        action: 'UPDATE',
        match: { id: orderId },
        payload: changes
      });
      await refreshQueueCount();
      return;
    }

    try {
      const { error } = await supabase.from('ordenes_trabajo').update(changes).eq('id', orderId);
      if (error) throw error;
      await loadRoleData(currentUser);
    } catch {
      setIsOffline(true);
      await enqueueOfflineMutation({
        table: 'ordenes_trabajo',
        action: 'UPDATE',
        match: { id: orderId },
        payload: changes
      });
      await refreshQueueCount();
    }
  };

  const handleSyncOfflineQueue = async () => {
    if (isOffline || !navigator.onLine) return;
    try {
      const queue = await getPendingMutations();
      for (const item of queue) {
        if (item.action === 'INSERT') {
          const { error } = await supabase.from(item.table).insert([item.payload]);
          if (error) throw error;
        } else if (item.action === 'UPDATE') {
          const { error } = await supabase.from(item.table).update(item.payload).match(item.match);
          if (error) throw error;
        }
        await clearMutationById(item.id);
      }
      await refreshQueueCount();
      await loadRoleData(currentUser);
    } catch {
      setIsOffline(true);
    }
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
        onRefreshData={() => loadRoleData(currentUser)}
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