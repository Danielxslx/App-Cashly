export const colores = {
    // ---------- Base (modo claro) ----------
    fondo: '#F4F5F9',
    tarjeta: '#FFFFFF',
    bordes: '#ECEEF4',
    texto: '#0E1525',
    texto2: '#6B7385',
    placeholder: '#9AA1B2',
    campo: '#FAFBFD',

    // ---------- Marca ----------
    acento: '#4C6FFF',
    acento2: '#22D3EE',

    // ---------- Estados ----------
    ingreso: '#16A34A',
    gasto: '#EF4444',
    ok: '#16A34A',
    alerta: '#F59E0B',

    // ---------- Barra de pestañas ----------
    barra: '#FFFFFF',
    inactivo: '#9AA1B2',

    // ---------- Tarjeta oscura (la del total en Inicio) ----------
    heroA: '#0A0F1E',
    heroB: '#16204A',
    textoGastos: '#FFFFFF',
};

// Color, fondo suave e ícono de cada categoría (íconos de Ionicons, ya incluidos en Expo)
export const categorias: Record<string, { color: string; fondo: string; icono: string }> = {
    Comida: { color: '#F97316', fondo: '#FFF1E6', icono: 'restaurant-outline' },
    Transporte: { color: '#3B82F6', fondo: '#E6F0FF', icono: 'car-outline' },
    Ocio: { color: '#A855F7', fondo: '#F5E9FE', icono: 'film-outline' },
    Compras: { color: '#EC4899', fondo: '#FDE8F3', icono: 'bag-handle-outline' },
    Salud: { color: '#14B8A6', fondo: '#DFF7F4', icono: 'heart-outline' },
    Otros: { color: '#64748B', fondo: '#EAEDF2', icono: 'ellipsis-horizontal' },
};

export const categoriaDe = (nombre?: string | null) =>
    (nombre && categorias[nombre]) || categorias.Otros;