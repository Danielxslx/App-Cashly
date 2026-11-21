import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ComponentProps, useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Cuenta, Estadisticas, eliminarCuenta, obtenerCuentas, obtenerEstadisticas } from '../admin';
import { colores } from '../tema';

type Icono = ComponentProps<typeof Ionicons>['name'];

const fecha = (ms: number | null) =>
    ms
        ? new Date(ms).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';

const diaCorto = (k: string) => {
    const [, m, d] = k.split('-');
    return `${Number(d)}/${Number(m)}`;
};

const numero = (n: number) => n.toLocaleString('es-CO');

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

export default function Admin() {
    const router = useRouter();
    const [stats, setStats] = useState<Estadisticas | null>(null);
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState('');

    const cargar = async () => {
        setError('');
        try {
            const [e, c] = await Promise.all([obtenerEstadisticas(), obtenerCuentas()]);
            setStats(e);
            setCuentas(c);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo cargar el panel');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [])
    );

    const refrescar = () => {
        setRefrescando(true);
        cargar();
    };

    const confirmarEliminar = (c: Cuenta) => {
        Alert.alert(
            'Eliminar cuenta',
            `Se borrarán la cuenta, sus ${c.transactions} transacciones y sus ${c.goals} metas. No se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await eliminarCuenta(c.id);
                            cargar();
                        } catch (err) {
                            Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar');
                        }
                    },
                },
            ]
        );
    };

    const max = stats ? Math.max(1, ...stats.daily.map((d) => d.transacciones)) : 1;

    return (
        <View style={s.contenedor}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={s.barra}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={s.atras}>
                    <Ionicons name="chevron-back" size={24} color={colores.texto} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={s.titulo}>Panel de administrador</Text>
                    {stats ? (
                        <Text style={s.subtitulo}>
                            Últimos {stats.range.days} días · {diaCorto(stats.range.from)} al{' '}
                            {diaCorto(stats.range.to)}
                        </Text>
                    ) : null}
                </View>
            </View>

            {cargando ? (
                <View style={s.centro}>
                    <ActivityIndicator color={colores.acento} size="large" />
                </View>
            ) : error ? (
                <View style={s.centro}>
                    <Ionicons name="alert-circle-outline" size={40} color={colores.gasto} />
                    <Text style={s.errorTexto}>{error}</Text>
                    <Pressable style={s.reintentar} onPress={refrescar}>
                        <Text style={s.reintentarTexto}>Reintentar</Text>
                    </Pressable>
                </View>
            ) : stats ? (
                <ScrollView
                    contentContainerStyle={s.contenido}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
                >
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

                    <Text style={[s.grupo, { marginTop: 24 }]}>Actividad</Text>
                    <View style={s.rejilla}>
                        <Dato
                            icono="swap-vertical"
                            valor={numero(stats.transactions.total)}
                            etiqueta="Transacciones totales"
                        />
                        <Dato
                            icono="calendar"
                            valor={numero(stats.transactions.in_range)}
                            etiqueta="Transacciones del período"
                        />
                        <Dato
                            icono="trending-up"
                            valor={stats.transactions.avg_per_day}
                            etiqueta="Promedio por día"
                        />
                        <Dato icono="flag" valor={numero(stats.goals.total)} etiqueta="Metas creadas" />
                        <Dato
                            icono="log-in"
                            valor={numero(stats.sessions.logins_in_range)}
                            etiqueta="Inicios de sesión"
                        />
                        <Dato
                            icono="flash"
                            valor={numero(stats.sessions.active_ingest_tokens)}
                            etiqueta="Atajos de Apple Pay activos"
                        />
                    </View>

                    <Text style={[s.grupo, { marginTop: 24 }]}>Transacciones por día</Text>
                    <View style={s.tarjeta}>
                        <View style={s.grafica}>
                            {stats.daily.map((d) => (
                                <View
                                    key={d.date}
                                    style={[
                                        s.columna,
                                        {
                                            height: Math.max(3, (d.transacciones / max) * 110),
                                            opacity: d.transacciones ? 1 : 0.25,
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
                            {stats.transactions.busiest_day
                                ? `Día con más movimiento: ${diaCorto(stats.transactions.busiest_day.date)} (${stats.transactions.busiest_day.count})`
                                : 'Sin transacciones en el período'}
                        </Text>
                    </View>

                    <Text style={[s.grupo, { marginTop: 24 }]}>Cuentas ({cuentas.length})</Text>
                    <View style={s.tarjeta}>
                        {cuentas.map((c, i) => (
                            <View key={String(c.id)} style={[s.cuenta, i > 0 && s.cuentaBorde]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.cuentaNombre}>
                                        {c.is_admin ? 'Tú (administrador)' : `Cuenta ${String(c.id).slice(0, 8)}`}
                                    </Text>
                                    <View style={s.etiquetas}>
                                        <Text style={[s.etiqueta, c.email_verified ? s.etiquetaOk : s.etiquetaMal]}>
                                            {c.email_verified ? 'Verificada' : 'Sin verificar'}
                                        </Text>
                                        <Text style={[s.etiqueta, c.mfa_enabled ? s.etiquetaOk : s.etiquetaMal]}>
                                            {c.mfa_enabled ? '2FA' : 'Sin 2FA'}
                                        </Text>
                                    </View>
                                    <Text style={s.cuentaDetalle}>
                                        {c.transactions} transacciones · {c.goals} metas
                                    </Text>
                                    <Text style={s.cuentaDetalle}>
                                        Registro {fecha(c.created_at)} · Última actividad{' '}
                                        {fecha(c.last_activity_at)}
                                    </Text>
                                </View>
                                {!c.is_admin ? (
                                    <Pressable onPress={() => confirmarEliminar(c)} hitSlop={10}>
                                        <Ionicons name="trash-outline" size={20} color={colores.gasto} />
                                    </Pressable>
                                ) : null}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            ) : null}
        </View>
    );
}

const s = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    barra: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 12,
    },
    atras: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colores.tarjeta,
        borderWidth: 1,
        borderColor: colores.bordes,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titulo: { fontSize: 22, fontWeight: '800', color: colores.texto, letterSpacing: -0.4 },
    subtitulo: { fontSize: 13, color: colores.texto2, marginTop: 2 },

    centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12 },
    errorTexto: { color: colores.texto2, textAlign: 'center', fontSize: 15 },
    reintentar: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14, backgroundColor: '#E8ECFF' },
    reintentarTexto: { color: colores.acento, fontWeight: '800' },

    contenido: { padding: 20, paddingTop: 8, paddingBottom: 50 },

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
    grafica: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 114 },
    columna: { flex: 1, borderRadius: 3, backgroundColor: colores.acento },
    ejes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    eje: { fontSize: 11.5, color: colores.texto2 },
    nota: { fontSize: 13, color: colores.texto2, marginTop: 10 },

    cuenta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    cuentaBorde: { borderTopWidth: 1, borderTopColor: colores.bordes },
    cuentaNombre: { fontSize: 15, fontWeight: '700', color: colores.texto },
    etiquetas: { flexDirection: 'row', gap: 6, marginTop: 6, marginBottom: 6 },
    etiqueta: { fontSize: 11.5, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
    etiquetaOk: { backgroundColor: '#E7F8EE', color: colores.ok },
    etiquetaMal: { backgroundColor: '#FEE9E9', color: colores.gasto },
    cuentaDetalle: { fontSize: 12.5, color: colores.texto2, marginTop: 2 },
});