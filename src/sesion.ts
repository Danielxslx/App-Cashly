import * as SecureStore from 'expo-secure-store';

let accessToken = '';
let refreshToken = '';

type DatosMfa = {
  mfaToken: string;
  qrCode: string;
  otpauthUrl: string;
  secret: string;
};

let mfaPendiente: DatosMfa | null = null;
let mfaLogin = '';

export const guardarToken = (token: string) => {
  accessToken = token;
};
export const obtenerToken = () => accessToken;

export const guardarRefresh = (token: string) => {
  refreshToken = token;
  SecureStore.setItemAsync('refreshToken', token).catch(() => {});
};
export const obtenerRefresh = () => refreshToken;

export const cargarRefreshGuardado = async () => {
  try {
    const guardado = await SecureStore.getItemAsync('refreshToken');
    if (guardado) {
      refreshToken = guardado;
    }
    return guardado ?? '';
  } catch {
    return '';
  }
};

const claveDe = (prefijo: string, correo: string) =>
  `${prefijo}_${correo.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_')}`;

export const guardarNombre = (correo: string, nombre: string) => {
  if (nombre.trim() === '') {
    return;
  }
  SecureStore.setItemAsync(claveDe('nombre', correo), nombre.trim()).catch(() => {});
};

export const obtenerNombre = async (correo: string) => {
  try {
    return (await SecureStore.getItemAsync(claveDe('nombre', correo))) ?? '';
  } catch {
    return '';
  }
};

export const guardarCorreoActual = (correo: string) => {
  SecureStore.setItemAsync('correoActual', correo.trim().toLowerCase()).catch(() => {});
};

export const obtenerCorreoActual = async () => {
  try {
    return (await SecureStore.getItemAsync('correoActual')) ?? '';
  } catch {
    return '';
  }
};

export const guardarMfa = (datos: DatosMfa) => {
  mfaPendiente = datos;
};
export const obtenerMfa = () => mfaPendiente;

export const guardarMfaLogin = (token: string) => {
  mfaLogin = token;
};
export const obtenerMfaLogin = () => mfaLogin;

export const limpiarSesion = () => {
  accessToken = '';
  refreshToken = '';
  mfaPendiente = null;
  mfaLogin = '';
  SecureStore.deleteItemAsync('refreshToken').catch(() => {});
  SecureStore.deleteItemAsync('correoActual').catch(() => {});
};