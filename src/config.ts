const LOCAL = 'http://172.16.129.245:3000/v1';
const NUBE = 'https://api.cashly.lat/v1';

const USAR_NUBE = false;

export const API = USAR_NUBE ? NUBE : LOCAL;