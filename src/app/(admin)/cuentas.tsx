import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Cuenta, buscarCuenta, eliminarCuenta, eliminarUltimaCuenta, obtenerCuentas } from '../../admin';
import { EncabezadoAdmin } from '../../EncabezadoAdmin';
import { colores } from '../../tema';

type Filtro = 'todas' | 'sin-verificar' | 'sin-2fa' | 'sin-gastos';

const FILTROS: { valor: Filtro; texto: string }[] = [
    { valor: 'todas', texto: 'Todas' },
    { valor: 'sin-verificar', texto: 'Sin verificar' },
    { valor: 'sin-2fa', texto: 'Sin 2FA' },
    { valor: 'sin-gastos', texto: 'Sin gastos' },
];

const fecha = (ms: number | null) =>
    ms
        ? new Date(ms).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';

const nombreCuenta = (c: Cuenta) =>
    c.is_admin ? 'Tú (administrador)' : `Cuenta ${String(c.id).slice(0, 8)}`;

const aplicarFiltro = (lista: Cuenta[], f: Filtro) => {
    if (f === 'sin-verificar') return lista.filter((c) => !c.email_verified);
    if (f === 'sin-2fa') return lista.filter((c) => !c.mfa_enabled);
    if (f === 'sin-gastos') return lista.filter((c) => c.transactions === 0);
    return lista;
};

export default function Cuentas() {
    const [cuentas, setCuentas] = useState<Cuenta[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState('');

    const [correo, setCorreo] = useState('');
    const [resultado, setResultado] = useState<Cuenta[] | null>(null); // null = sin búsqueda activa
    const [buscando, setBuscando] = useState(false);
    const [errorBusqueda, setErrorBusqueda] = useState('');

    const [filtro, setFiltro] = useState<Filtro>('todas');

    const cargar = async () => {
        setError('');
        try {
            setCuentas(await obtenerCuentas());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudieron cargar las cuentas');
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

    const buscar = async () => {
        if (!correo.trim()) return;
        setErrorBusqueda('');
        setBuscando(true);
        try {
            setResultado(await buscarCuenta(correo));
        } catch (err) {
            setErrorBusqueda(err instanceof Error ? err.message : 'No se pudo buscar');
            setResultado(null);
        } finally {
            setBuscando(false);
        }
    };

    const limpiarBusqueda = () => {
        setCorreo('');
        setResultado(null);
        setErrorBusqueda('');
    };

    const confirmarEliminar = (c: Cuenta) => {
        Alert.alert(
            'Eliminar cuenta',
            `Se borrarán la cuenta, sus ${c.transactions} transacciones, sus ${c.goals} metas y sus sesiones. No se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await eliminarCuenta(c.id);
                            limpiarBusqueda();
                            cargar();
                            Alert.alert('Listo', 'La cuenta fue eliminada.');
                        } catch (err) {
                            Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar');
                        }
                    },
                },
            ]
        );
    };

    const confirmarEliminarUltima = () => {
        Alert.alert(
            'Eliminar la última cuenta creada',
            'Se borrará la cuenta registrada más recientemente, con todos sus datos. Sirve para limpiar cuentas de prueba. No se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const r = await eliminarUltimaCuenta();
                            limpiarBusqueda();
                            cargar();
                            Alert.alert(
                                'Listo',
                                `Se eliminó la cuenta creada el ${fecha(r.deleted?.created_at ?? null)}, con ${r.deleted?.transactions ?? 0} transacciones y ${r.deleted?.goals ?? 0} metas.`
                            );
                        } catch (err) {
                            Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo eliminar');
                        }
                    },
                },
            ]
        );
    };

    const lista = resultado ?? aplicarFiltro(cuentas, filtro);

    return (
        <View style={s.contenedor}>
            <EncabezadoAdmin
                titulo="Cuentas"
                subtitulo={cargando ? undefined : `${cuentas.length} cuentas registradas`}
            />

            <ScrollView
                contentContainerStyle={s.contenido}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
            >
                {/* Buscar por correo */}
                <View style={s.buscador}>
                    <Ionicons name="search" size={18} color={colores.texto2} />
                    <TextInput
                        style={s.entrada}
                        placeholder="Buscar por correo exacto"
                        placeholderTextColor={colores.placeholder}
                        value={correo}
                        onChangeText={setCorreo}
                        onSubmitEditing={buscar}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        returnKeyType="search"
                    />
                    {correo ? (
                        <Pressable onPress={limpiarBusqueda} hitSlop={10}>
                            <Ionicons name="close-circle" size={18} color={colores.placeholder} />
                        </Pressable>
                    ) : null}
                </View>
                <Pressable
                    style={[s.botonBuscar, (!correo.trim() || buscando) && { opacity: 0.5 }]}
                    onPress={buscar}
                    disabled={!correo.trim() || buscando}
                >
                    {buscando ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={s.botonBuscarTexto}>Buscar</Text>
                    )}
                </Pressable>
                <Text style={s.ayuda}>
                    Los correos no se guardan en texto: la búsqueda compara la huella del correo, por eso debe
                    ser exacto.
                </Text>
                {errorBusqueda ? <Text style={s.error}>{errorBusqueda}</Text> : null}

                {/* Filtros (solo sin búsqueda activa) */}
                {resultado === null ? (
                    <View style={s.chips}>
                        {FILTROS.map((f) => {
                            const activo = f.valor === filtro;
                            const n = aplicarFiltro(cuentas, f.valor).length;
                            return (
                                <Pressable
                                    key={f.valor}
                                    onPress={() => setFiltro(f.valor)}
                                    style={[s.chip, activo && s.chipActivo]}
                                >
                                    <Text style={[s.chipTexto, activo && s.chipTextoActivo]}>
                                        {f.texto} ({n})
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                ) : (
                    <View style={s.avisoBusqueda}>
                        <Text style={s.avisoBusquedaTexto}>
                            {resultado.length ? 'Resultado de la búsqueda' : 'No hay ninguna cuenta con ese correo'}
                        </Text>
                        <Pressable onPress={limpiarBusqueda}>
                            <Text style={s.verTodas}>Ver todas</Text>
                        </Pressable>
                    </View>
                )}

                {/* Lista */}
                {cargando ? (
                    <ActivityIndicator color={colores.acento} size="large" style={{ marginTop: 30 }} />
                ) : error ? (
                    <Text style={s.error}>{error}</Text>
                ) : lista.length === 0 ? (
                    resultado === null ? <Text style={s.vacio}>No hay cuentas con este filtro.</Text> : null
                ) : (
                    <View style={s.tarjeta}>
                        {lista.map((c, i) => (
                            <View key={String(c.id)} style={[s.cuenta, i > 0 && s.cuentaBorde]}>
                                <View style={[s.avatar, c.is_admin && { backgroundColor: '#E8ECFF' }]}>
                                    <Ionicons
                                        name={c.is_admin ? 'shield-checkmark' : 'person'}
                                        size={18}
                                        color={c.is_admin ? colores.acento : colores.texto2}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.cuentaNombre}>{nombreCuenta(c)}</Text>
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
                                    <Text style={s.cuentaDetalle}>Registro: {fecha(c.created_at)}</Text>
                                    <Text style={s.cuentaDetalle}>
                                        Última actividad: {fecha(c.last_activity_at)}
                                    </Text>
                                </View>
                                {!c.is_admin ? (
                                    <Pressable onPress={() => confirmarEliminar(c)} hitSlop={10} style={s.borrar}>
                                        <Ionicons name="trash-outline" size={20} color={colores.gasto} />
                                    </Pressable>
                                ) : null}
                            </View>
                        ))}
                    </View>
                )}

                {/* Eliminar la última */}
                {!cargando && cuentas.some((c) => !c.is_admin) ? (
                    <Pressable style={s.botonUltima} onPress={confirmarEliminarUltima}>
                        <Ionicons name="trash" size={18} color={colores.gasto} />
                        <Text style={s.botonUltimaTexto}>Eliminar la última cuenta creada</Text>
                    </Pressable>
                ) : null}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 20, paddingTop: 4, paddingBottom: 50 },

    buscador: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colores.tarjeta,
        borderWidth: 1,
        borderColor: colores.bordes,
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 50,
    },
    entrada: { flex: 1, fontSize: 15, color: colores.texto },
    botonBuscar: {
        marginTop: 10,
        height: 46,
        borderRadius: 14,
        backgroundColor: colores.acento,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botonBuscarTexto: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    ayuda: { fontSize: 12, color: colores.texto2, marginTop: 8, lineHeight: 17 },
    error: { color: colores.gasto, marginTop: 10 },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18, marginBottom: 14 },
    chip: {
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: colores.tarjeta,
        borderWidth: 1,
        borderColor: colores.bordes,
    },
    chipActivo: { backgroundColor: colores.acento, borderColor: colores.acento },
    chipTexto: { fontSize: 13, fontWeight: '700', color: colores.texto2 },
    chipTextoActivo: { color: '#FFFFFF' },

    avisoBusqueda: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        marginBottom: 14,
    },
    avisoBusquedaTexto: { fontSize: 14, fontWeight: '700', color: colores.texto },
    verTodas: { color: colores.acento, fontWeight: '800' },
    vacio: { color: colores.texto2, textAlign: 'center', marginTop: 20 },

    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colores.bordes,
        paddingHorizontal: 16,
    },
    cuenta: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
    cuentaBorde: { borderTopWidth: 1, borderTopColor: colores.bordes },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colores.fondo,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cuentaNombre: { fontSize: 15, fontWeight: '700', color: colores.texto },
    etiquetas: { flexDirection: 'row', gap: 6, marginTop: 6, marginBottom: 6 },
    etiqueta: {
        fontSize: 11.5,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: 'hidden',
    },
    etiquetaOk: { backgroundColor: '#E7F8EE', color: colores.ok },
    etiquetaMal: { backgroundColor: '#FEE9E9', color: colores.gasto },
    cuentaDetalle: { fontSize: 12.5, color: colores.texto2, marginTop: 2 },
    borrar: { paddingTop: 4 },

    botonUltima: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#FEE9E9',
    },
    botonUltimaTexto: { color: colores.gasto, fontWeight: '800', fontSize: 14.5 },
});