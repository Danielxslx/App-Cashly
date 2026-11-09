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
};