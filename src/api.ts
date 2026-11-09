import { API } from './config';
import { guardarRefresh, guardarToken, obtenerRefresh, obtenerToken } from './sesion';

const renovar = async () => {
  try {
    const respuesta = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: obtenerRefresh() }),
    });
    if (!respuesta.ok) return false;
    const datos = await respuesta.json();
    guardarToken(datos.accessToken);
    guardarRefresh(datos.refreshToken);
    return true;
  } catch {
    return false;
  }
};

export const peticion = async (ruta: string, opciones: RequestInit = {}) => {
  const hacer = () =>
    fetch(`${API}${ruta}`, {
      ...opciones,
      headers: {
        ...(opciones.headers as object),
        Authorization: `Bearer ${obtenerToken()}`,
      },
    });

  let respuesta = await hacer();
  if (respuesta.status === 401 && (await renovar())) {
    respuesta = await hacer();
  }
  return respuesta;
};