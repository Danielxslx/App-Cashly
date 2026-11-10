const LOCAL = 'http://192.168.1.35:3000/v1';
const NUBE = 'https://PEGA_AQUI_LA_DIRECCION_DE_LA_NUBE/v1';

const USAR_NUBE = false;

export const API = USAR_NUBE ? NUBE : LOCAL;