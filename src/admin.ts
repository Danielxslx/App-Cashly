import { peticion } from './api';

export type Estadisticas = {
  range: { from: string; to: string; tz: string; days: number };
  users: {
    total: number;
    verified: number;
    pending_verification: number;
    mfa_enabled: number;
    new_in_range: number;
    active_in_range: number;
    with_open_session: number;
  };
  transactions: {
    total: number;
    in_range: number;
    users_with_transactions: number;
    avg_per_day: number;
    avg_per_active_user: number;
    busiest_day: { date: string; count: number } | null;
  };
  goals: { total: number; users_with_goals: number; in_range: number };
  sessions: { logins_in_range: number; active_ingest_tokens: number };
  daily: { date: string; registros: number; transacciones: number; metas: number; logins: number }[];
};

export type Cuenta = {
  id: string | number;
  is_admin: boolean;
  created_at: number | null;
  email_verified: boolean;
  mfa_enabled: boolean;
  transactions: number;
  goals: number;
  last_activity_at: number | null;
};

const zona = encodeURIComponent('America/Bogota');

// La API no dice en el login si eres admin: si las estadísticas responden bien, lo eres.
export const esAdmin = async () => {
  try {
    const r = await peticion(`/admin/stats?tz=${zona}`);
    return r.ok;
  } catch {
    return false;
  }
};

export const obtenerEstadisticas = async (): Promise<Estadisticas> => {
  const r = await peticion(`/admin/stats?tz=${zona}`);
  if (!r.ok) throw new Error('No se pudieron cargar las estadísticas');
  return r.json();
};

export const obtenerCuentas = async (): Promise<Cuenta[]> => {
  const r = await peticion('/admin/users');
  if (!r.ok) throw new Error('No se pudieron cargar las cuentas');
  return r.json();
};

export const eliminarCuenta = async (id: string | number) => {
  const r = await peticion(`/admin/users/${id}`, { method: 'DELETE' });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || 'No se pudo eliminar la cuenta');
  }
  return r.json();
};