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
    users_with_transactions_in_range: number;
    avg_per_day: number;
    avg_per_active_user: number;
    max_per_user_in_range: number;
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

export type Periodo = 7 | 30 | 90 | 365;

const zona = encodeURIComponent('America/Bogota');

// Fecha local del celular en formato AAAA-MM-DD (lo que pide la API).
const diaLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const rango = (dias: Periodo) => {
  const hoy = new Date();
  const inicio = new Date();
  inicio.setDate(hoy.getDate() - (dias - 1));
  return `from=${diaLocal(inicio)}&to=${diaLocal(hoy)}`;
};

const mensaje = async (r: Response, porDefecto: string) => {
  const e = await r.json().catch(() => ({}));
  return typeof e.error === 'string' ? e.error : porDefecto;
};

// La API no dice en el login si eres admin: si las estadísticas responden bien, lo eres.
export const esAdmin = async () => {
  try {
    const r = await peticion(`/admin/stats?tz=${zona}`);
    return r.ok;
  } catch {
    return false;
  }
};

export const obtenerEstadisticas = async (dias: Periodo = 30): Promise<Estadisticas> => {
  const r = await peticion(`/admin/stats?tz=${zona}&${rango(dias)}`);
  if (!r.ok) throw new Error(await mensaje(r, 'No se pudieron cargar las estadísticas'));
  return r.json();
};

export const obtenerCuentas = async (): Promise<Cuenta[]> => {
  const r = await peticion('/admin/users');
  if (!r.ok) throw new Error(await mensaje(r, 'No se pudieron cargar las cuentas'));
  return r.json();
};

// Busca por correo EXACTO: la API no guarda correos, solo compara su huella (HMAC).
export const buscarCuenta = async (correo: string): Promise<Cuenta[]> => {
  const r = await peticion(`/admin/users?email=${encodeURIComponent(correo.trim())}`);
  if (r.status === 400) throw new Error('Escribe un correo válido');
  if (!r.ok) throw new Error(await mensaje(r, 'No se pudo buscar la cuenta'));
  return r.json();
};

export const eliminarCuenta = async (id: string | number) => {
  const r = await peticion(`/admin/users/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(await mensaje(r, 'No se pudo eliminar la cuenta'));
  return r.json();
};

export const eliminarUltimaCuenta = async () => {
  const r = await peticion('/admin/users/latest', { method: 'DELETE' });
  if (r.status === 404) throw new Error('No hay cuentas para eliminar');
  if (!r.ok) throw new Error(await mensaje(r, 'No se pudo eliminar la cuenta'));
  return r.json();
};