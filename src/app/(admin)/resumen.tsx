import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { ComponentProps, useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Estadisticas, Periodo, obtenerEstadisticas } from '../../admin';
import { EncabezadoAdmin } from '../../EncabezadoAdmin';
import { colores } from '../../tema';

type Icono = ComponentProps<typeof Ionicons>['name'];
type Serie = 'transacciones' | 'registros' | 'metas' | 'logins';

const PERIODOS: { valor: Periodo; texto: string }[] = [
    { valor: 7, texto: '7 días' },
    { valor: 30, texto: '30 días' },
    { valor: 90, texto: '90 días' },
    { valor: 365, texto: '1 año' },
];

const SERIES: { valor: Serie; texto: string }[] = [
    { valor: 'transacciones', texto: 'Transacciones' },
    { valor: 'registros', texto: 'Registros' },
    { valor: 'metas', texto: 'Metas' },
    { valor: 'logins', texto: 'Logins' },
];

const diaCorto = (k: string) => {
    const [, m, d] = k.split('-');
    return `${Number(d)}/${Number(m)}`;
};

const numero = (n: number) => n.toLocaleString('es-CO');

// Con muchos días, las barras se agrupan para que quepan unas 30 en pantalla.
const agrupar = (daily: Estadisticas['daily'], serie: Serie) => {
    const tam = Math.max(1, Math.ceil(daily.length / 30));
    const grupos: { desde: string; valor: number }[] = [];
    for (let i = 0; i < daily.length; i += tam) {
        const trozo = daily.slice(i, i + tam);
        grupos.push({ desde: trozo[0].date, valor: trozo.reduce((a, d) => a + d[serie], 0) });
    }
    return { grupos, tam };
};

function Dato({
    icono,
    valor,
    etiqueta,
    color = colores.acento,
}: {
    icono: Icono;
    valor: string | number;
    etiqueta: string;
    color?: string;
}) {
    return (
        <View style={s.dato}>
            <Ionicons name={icono} size={18} color={color} />
            <Text style={s.datoValor}>{valor}</Text>
            <Text style={s.datoEtiqueta}>{etiqueta}</Text>
        </View>
    );
}

function Chips<T extends string | number>({
    opciones,
    valor,
    onCambio,
}: {
    opciones: { valor: T; texto: string }[];
    valor: T;
    onCambio: (v: T) => void;
}) {
    return (
        <View style={s.chips}>
            {opciones.map((o) => {
                const activo = o.valor === valor;
                return (
                    <Pressable
                        key={String(o.valor)}
                        onPress={() => onCambio(o.valor)}
                        style={[s.chip, activo && s.chipActivo]}
                    >
                        <Text style={[s.chipTexto, activo && s.chipTextoActivo]}>{o.texto}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export default function Resumen() {
    const [periodo, setPeriodo] = useState<Periodo>(30);
    const [serie, setSerie] = useState<Serie>('transacciones');
    const [stats, setStats] = useState<Estadisticas | null>(null);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState('');

    const cargar = async (p: Periodo) => {
        setError('');
        try {
            setStats(await obtenerEstadisticas(p));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargar(periodo);
        }, [periodo])
    );

    const cambiarPeriodo = (p: Periodo) => {
        if (p === periodo) return;
        setCargando(true);
        setPeriodo(p);
    };

    const refrescar = () => {
        setRefrescando(true);
        cargar(periodo);
    };

    const subtitulo = stats
        ? `${diaCorto(stats.range.from)} al ${diaCorto(stats.range.to)} · ${stats.range.days} días`
        : undefined;

    if (!stats) {
        return (
            <View style={s.contenedor}>
                <EncabezadoAdmin titulo="Resumen" />
                <View style={s.centro}>
                    {error ? (
                        <>
                            <Ionicons name="alert-circle-outline" size={40} color={colores.gasto} />
                            <Text style={s.errorTexto}>{error}</Text>
                            <Pressable style={s.reintentar} onPress={refrescar}>
                                <Text style={s.reintentarTexto}>Reintentar</Text>
                            </Pressable>
                        </>
                    ) : (
                        <ActivityIndicator color={colores.acento} size="large" />
                    )}
                </View>
            </View>
        );
    }

    const { grupos, tam } = agrupar(stats.daily, serie);
    const max = Math.max(1, ...grupos.map((g) => g.valor));
    const total = grupos.reduce((a, g) => a + g.valor, 0);
    const pico = grupos.reduce((a, g) => (g.valor > a.valor ? g : a), grupos[0]);

    return (
        <View style={s.contenedor}>
            <EncabezadoAdmin titulo="Resumen" subtitulo={subtitulo} />

            <ScrollView
                contentContainerStyle={s.contenido}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
            >
                <View style={s.filaPeriodo}>
                    <Chips opciones={PERIODOS} valor={periodo} onCambio={cambiarPeriodo} />
                    {cargando ? <ActivityIndicator color={colores.acento} /> : null}
                </View>

                {error ? <Text style={s.errorLinea}>{error}</Text> : null}

                <View style={{ opacity: cargando ? 0.5 : 1 }}>
                    <View style={s.privacidad}>
                        <Ionicons name="lock-closed" size={18} color={colores.ok} />
                        <Text style={s.privacidadTexto}>
                            Solo ves métricas. Los correos, montos y comercios de cada usuario están
                            cifrados con su propia llave.
                        </Text>
                    </View>

                    <Text style={s.grupo}>Usuarios</Text>
                    <View style={s.rejilla}>
                        <Dato icono="people" valor={numero(stats.users.total)} etiqueta="Cuentas totales" />
                        <Dato
                            icono="person-add"
                            valor={numero(stats.users.new_in_range)}
                            etiqueta="Nuevas en el período"
                            color={colores.ok}
                        />
                        <Dato
                            icono="pulse"
                            valor={numero(stats.users.active_in_range)}
                            etiqueta="Activas en el período"
                            color={colores.ok}
                        />
                        <Dato
                            icono="phone-portrait"
                            valor={numero(stats.users.with_open_session)}
                            etiqueta="Con sesión abierta"
                        />
                        <Dato
                            icono="mail"
                            valor={`${stats.users.verified}/${stats.users.total}`}
                            etiqueta="Correo verificado"
                        />
                        <Dato
                            icono="shield-checkmark"
                            valor={`${stats.users.mfa_enabled}/${stats.users.total}`}
                            etiqueta="Con 2FA activo"
                            color={colores.ok}
                        />
                    </View>

                    <Text style={[s.grupo, s.separado]}>Actividad del período</Text>
                    <View style={s.rejilla}>
                        <Dato
                            icono="swap-vertical"
                            valor={numero(stats.transactions.in_range)}
                            etiqueta="Transacciones"
                        />
                        <Dato
                            icono="trending-up"
                            valor={stats.transactions.avg_per_day}
                            etiqueta="Promedio por día"
                        />
                        <Dato
                            icono="person"
                            valor={stats.transactions.avg_per_active_user}
                            etiqueta="Por usuario activo"
                        />
                        <Dato
                            icono="card"
                            valor={numero(stats.transactions.users_with_transactions_in_range)}
                            etiqueta="Usuarios que registraron gastos"
                        />
                        <Dato icono="flag" valor={numero(stats.goals.in_range)} etiqueta="Metas nuevas" />
                        <Dato
                            icono="log-in"
                            valor={numero(stats.sessions.logins_in_range)}
                            etiqueta="Inicios de sesión"
                        />
                    </View>

                    <Text style={[s.grupo, s.separado]}>Evolución</Text>
                    <View style={s.tarjeta}>
                        <Chips opciones={SERIES} valor={serie} onCambio={setSerie} />
                        <View style={s.grafica}>
                            {grupos.map((g) => (
                                <View
                                    key={g.desde}
                                    style={[
                                        s.columna,
                                        {
                                            height: Math.max(3, (g.valor / max) * 110),
                                            opacity: g.valor ? 1 : 0.25,
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                        <View style={s.ejes}>
                            <Text style={s.eje}>{diaCorto(stats.range.from)}</Text>
                            <Text style={s.eje}>{diaCorto(stats.range.to)}</Text>
                        </View>
                        <Text style={s.nota}>
                            Total: {numero(total)}
                            {pico.valor ? ` · Máximo: ${pico.valor} (${diaCorto(pico.desde)})` : ''}
                            {tam > 1 ? ` · Cada barra = ${tam} días` : ''}
                        </Text>
                    </View>

                    <Text style={[s.grupo, s.separado]}>Totales históricos</Text>
                    <View style={s.rejilla}>
                        <Dato
                            icono="receipt"
                            valor={numero(stats.transactions.total)}
                            etiqueta="Transacciones totales"
                        />
                        <Dato
                            icono="people-circle"
                            valor={numero(stats.transactions.users_with_transactions)}
                            etiqueta="Usuarios con transacciones"
                        />
                        <Dato icono="flag" valor={numero(stats.goals.total)} etiqueta="Metas totales" />
                        <Dato
                            icono="flash"
                            valor={numero(stats.sessions.active_ingest_tokens)}
                            etiqueta="Atajos de Apple Pay activos"
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 20, paddingTop: 4, paddingBottom: 50 },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12 },
    errorTexto: { color: colores.texto2, textAlign: 'center', fontSize: 15 },
    errorLinea: { color: colores.gasto, marginBottom: 12 },
    reintentar: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14, backgroundColor: '#E8ECFF' },
    reintentarTexto: { color: colores.acento, fontWeight: '800' },

    filaPeriodo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: 12,
        backgroundColor: colores.tarjeta,
        borderWidth: 1,
        borderColor: colores.bordes,
    },
    chipActivo: { backgroundColor: colores.acento, borderColor: colores.acento },
    chipTexto: { fontSize: 13, fontWeight: '700', color: colores.texto2 },
    chipTextoActivo: { color: '#FFFFFF' },

    privacidad: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#E7F8EE',
        borderRadius: 16,
        padding: 14,
        marginBottom: 22,
    },
    privacidadTexto: { flex: 1, color: colores.texto, fontSize: 13, lineHeight: 18 },

    grupo: {
        fontSize: 12.5,
        fontWeight: '700',
        color: colores.texto2,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 10,
        marginLeft: 4,
    },
    separado: { marginTop: 24 },
    rejilla: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
    dato: {
        width: '48.5%',
        backgroundColor: colores.tarjeta,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colores.bordes,
        padding: 14,
    },
    datoValor: { fontSize: 24, fontWeight: '800', color: colores.texto, marginTop: 8, letterSpacing: -0.5 },
    datoEtiqueta: { fontSize: 12.5, color: colores.texto2, marginTop: 2 },

    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colores.bordes,
        padding: 16,
    },
    grafica: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 114, marginTop: 16 },
    columna: { flex: 1, borderRadius: 3, backgroundColor: colores.acento },
    ejes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    eje: { fontSize: 11.5, color: colores.texto2 },
    nota: { fontSize: 13, color: colores.texto2, marginTop: 10 },
});