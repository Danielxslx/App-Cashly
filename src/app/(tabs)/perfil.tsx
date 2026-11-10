import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { peticion } from '../../api';
import { API } from '../../config';
import {
    guardarRefresh,
    guardarToken,
    limpiarSesion,
    obtenerCorreoActual,
    obtenerNombre,
    obtenerToken,
} from '../../sesion';
import { colores } from '../../tema';
import { Boton, Campo } from '../../ui';

type TokenIngesta = {
    id: string;
    label: string | null;
    created_at: number;
    last_used_at: number | null;
};

const fechaCorta = (ms: number) =>
    new Date(ms).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

export default function Perfil() {
    const router = useRouter();
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [errorClave, setErrorClave] = useState('');
    const [aviso, setAviso] = useState('');
    const [guardando, setGuardando] = useState(false);

    // captura automática (Atajo de iPhone)
    const [tokens, setTokens] = useState<TokenIngesta[]>([]);
    const [creando, setCreando] = useState(false);
    const [errorToken, setErrorToken] = useState('');
    const [tokenNuevo, setTokenNuevo] = useState('');

    const cargarTokens = async () => {
        try {
            const r = await peticion('/ingest-tokens');
            if (r.ok) {
                setTokens(await r.json());
            }
        } catch {
            // si falla, la lista queda como estaba
        }
    };

    useFocusEffect(
        useCallback(() => {
            const cargarDatos = async () => {
                const c = await obtenerCorreoActual();
                setCorreo(c);
                if (c) {
                    setNombre(await obtenerNombre(c));
                }
            };
            cargarDatos();
            cargarTokens();
        }, [])
    );

    const cerrarModal = () => {
        setModalAbierto(false);
        setActual('');
        setNueva('');
        setErrorClave('');
    };

    const cambiarClave = async () => {
        if (actual === '') {
            setErrorClave('Escribe tu contraseña actual');
            return;
        }
        if (nueva.length < 10) {
            setErrorClave('La contraseña nueva debe tener mínimo 10 caracteres');
            return;
        }
        if (nueva === actual) {
            setErrorClave('La contraseña nueva debe ser distinta de la actual');
            return;
        }
        setErrorClave('');
        setGuardando(true);
        try {
            const respuesta = await peticion('/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: actual, newPassword: nueva }),
            });
            const datos = await respuesta.json();
            if (respuesta.ok) {
                guardarToken(datos.accessToken);
                guardarRefresh(datos.refreshToken);
                cerrarModal();
                setAviso('Contraseña actualizada');
            } else {
                setErrorClave(datos.error ?? 'No se pudo cambiar la contraseña');
            }
        } catch {
            setErrorClave('No se pudo conectar con el servidor');
        } finally {
            setGuardando(false);
        }
    };

    const crearToken = async () => {
        setErrorToken('');
        setCreando(true);
        try {
            const r = await peticion('/ingest-tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: nombre ? `iPhone de ${nombre}` : 'Mi iPhone' }),
            });
            const d = await r.json();
            if (r.ok) {
                setTokenNuevo(d.token);
                cargarTokens();
            } else {
                setErrorToken(d.error ?? 'No se pudo crear el token');
            }
        } catch {
            setErrorToken('No se pudo conectar con el servidor');
        } finally {
            setCreando(false);
        }
    };

    const revocarToken = (t: TokenIngesta) => {
        Alert.alert(
            'Revocar token',
            'El atajo que use este token dejará de registrar gastos. ¿Continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Revocar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const r = await peticion(`/ingest-tokens/${encodeURIComponent(t.id)}`, {
                                method: 'DELETE',
                            });
                            if (r.ok || r.status === 204) {
                                cargarTokens();
                            } else {
                                setErrorToken('No se pudo revocar el token');
                            }
                        } catch {
                            setErrorToken('No se pudo conectar con el servidor');
                        }
                    },
                },
            ]
        );
    };

    const cerrarSesion = async () => {
        const token = obtenerToken();
        // avisamos al servidor sin esperar su respuesta
        fetch(`${API}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {
            // si no hay conexión, igual cerramos la sesión en la app
        });
        await limpiarSesion();
        router.replace('/');
    };

    const inicial = (nombre || correo || '?').trim().charAt(0).toUpperCase();

    return (
        <View style={s.contenedor}>
            <ScrollView contentContainerStyle={s.contenido} showsVerticalScrollIndicator={false}>
                <View style={s.cabecera}>
                    <View style={s.avatar}>
                        <Text style={s.inicial}>{inicial}</Text>
                    </View>
                    <Text style={s.titulo}>{nombre ? `Hola, ${nombre}` : 'Hola'}</Text>
                    {correo ? <Text style={s.correo}>{correo}</Text> : null}
                </View>

                {aviso ? (
                    <View style={s.aviso}>
                        <Ionicons name="checkmark-circle" size={18} color={colores.ok} />
                        <Text style={s.avisoTexto}>{aviso}</Text>
                    </View>
                ) : null}

                <View style={s.seguridad}>
                    <View style={s.seguridadIcono}>
                        <Ionicons name="shield-checkmark" size={22} color={colores.ok} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.seguridadTitulo}>Cuenta protegida</Text>
                        <Text style={s.seguridadTexto}>
                            Tu sesión usa verificación en dos pasos.
                        </Text>
                    </View>
                </View>

                <Text style={s.grupo}>Captura automática</Text>
                <View style={s.lista}>
                    <View style={s.captura}>
                        <View style={s.capturaFila}>
                            <View style={[s.opcionIcono, { backgroundColor: '#E8ECFF' }]}>
                                <Ionicons name="flash" size={20} color={colores.acento} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.opcionTexto}>Gastos desde Apple Pay</Text>
                                <Text style={s.capturaDesc}>
                                    Conecta un Atajo de tu iPhone y cada pago con tarjeta se
                                    registra solo.
                                </Text>
                            </View>
                        </View>

                        {tokens.map((t) => (
                            <View key={t.id} style={s.tokenFila}>
                                <Ionicons name="phone-portrait-outline" size={18} color={colores.texto2} />
                                <View style={{ flex: 1 }}>
                                    <Text style={s.tokenNombre}>{t.label ?? 'Atajo'}</Text>
                                    <Text style={s.tokenDetalle}>
                                        Creado {fechaCorta(t.created_at)} ·{' '}
                                        {t.last_used_at
                                            ? `usado ${fechaCorta(t.last_used_at)}`
                                            : 'sin usar'}
                                    </Text>
                                </View>
                                <Pressable onPress={() => revocarToken(t)} hitSlop={10}>
                                    <Ionicons name="trash-outline" size={20} color={colores.gasto} />
                                </Pressable>
                            </View>
                        ))}

                        {errorToken ? <Text style={s.error}>{errorToken}</Text> : null}

                        <Pressable
                            style={[s.botonToken, creando && { opacity: 0.7 }]}
                            onPress={crearToken}
                            disabled={creando}
                        >
                            {creando ? (
                                <ActivityIndicator color={colores.acento} />
                            ) : (
                                <>
                                    <Ionicons name="add-circle-outline" size={20} color={colores.acento} />
                                    <Text style={s.botonTokenTexto}>Generar token para el Atajo</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>

                <Text style={[s.grupo, { marginTop: 26 }]}>Cuenta</Text>
                <View style={s.lista}>
                    <Pressable
                        style={s.opcion}
                        onPress={() => {
                            setAviso('');
                            setModalAbierto(true);
                        }}
                    >
                        <View style={[s.opcionIcono, { backgroundColor: '#E8ECFF' }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colores.acento} />
                        </View>
                        <Text style={[s.opcionTexto, { flex: 1 }]}>Cambiar contraseña</Text>
                        <Ionicons name="chevron-forward" size={20} color={colores.placeholder} />
                    </Pressable>
                    <View style={s.divisor} />
                    <Pressable style={s.opcion} onPress={cerrarSesion}>
                        <View style={[s.opcionIcono, { backgroundColor: '#FEE9E9' }]}>
                            <Ionicons name="log-out-outline" size={20} color={colores.gasto} />
                        </View>
                        <Text style={[s.opcionTexto, { color: colores.gasto }]}>Cerrar sesión</Text>
                    </Pressable>
                </View>

                <Text style={s.version}>Cashly</Text>
            </ScrollView>

            {/* Cambiar contraseña */}
            <Modal visible={modalAbierto} animationType="slide" transparent onRequestClose={cerrarModal}>
                <KeyboardAvoidingView
                    style={s.fondoModal}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Pressable style={{ flex: 1 }} onPress={cerrarModal} />
                    <View style={s.hoja}>
                        <View style={s.agarre} />
                        <Text style={s.tituloHoja}>Cambiar contraseña</Text>
                        <Campo
                            icono="lock-closed-outline"
                            placeholder="Contraseña actual"
                            clave
                            autoCapitalize="none"
                            value={actual}
                            onChangeText={setActual}
                        />
                        <Campo
                            icono="key-outline"
                            placeholder="Contraseña nueva (mín. 10 caracteres)"
                            clave
                            autoCapitalize="none"
                            value={nueva}
                            onChangeText={setNueva}
                        />
                        {errorClave ? <Text style={s.error}>{errorClave}</Text> : null}
                        <View style={{ height: 6 }} />
                        <Boton texto="Guardar" onPress={cambiarClave} cargando={guardando} />
                        <Pressable onPress={cerrarModal}>
                            <Text style={s.cancelar}>Cancelar</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Token recién creado (se muestra una sola vez) */}
            <Modal
                visible={tokenNuevo !== ''}
                animationType="slide"
                transparent
                onRequestClose={() => setTokenNuevo('')}
            >
                <View style={s.fondoModal}>
                    <View style={{ flex: 1 }} />
                    <View style={s.hoja}>
                        <View style={s.agarre} />
                        <View style={s.iconoLlave}>
                            <Ionicons name="key-outline" size={30} color="#B45309" />
                        </View>
                        <Text style={[s.tituloHoja, { textAlign: 'center' }]}>Tu token del Atajo</Text>
                        <Text style={s.tokenAyuda}>
                            Solo se muestra ahora. Cópialo (mantén presionado) o compártelo para
                            pegarlo en el Atajo.
                        </Text>
                        <View style={s.cajaToken}>
                            <Text selectable style={s.tokenTexto}>
                                {tokenNuevo}
                            </Text>
                        </View>
                        <Pressable
                            style={s.compartir}
                            onPress={() => Share.share({ message: tokenNuevo })}
                        >
                            <Ionicons name="share-outline" size={18} color={colores.acento} />
                            <Text style={s.compartirTexto}>Copiar o compartir</Text>
                        </Pressable>
                        <Boton texto="Listo" onPress={() => setTokenNuevo('')} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 20, paddingTop: 70, paddingBottom: 50 },

    cabecera: { alignItems: 'center', marginBottom: 26 },
    avatar: {
        width: 92,
        height: 92,
        borderRadius: 30,
        backgroundColor: colores.acento,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colores.acento,
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    inicial: { fontSize: 38, fontWeight: '800', color: '#FFFFFF' },
    titulo: { fontSize: 26, color: colores.texto, fontWeight: '800', letterSpacing: -0.6, marginTop: 16 },
    correo: { fontSize: 14.5, color: colores.texto2, marginTop: 4 },

    aviso: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#E7F8EE',
        paddingVertical: 12,
        borderRadius: 14,
        marginBottom: 16,
    },
    avisoTexto: { color: colores.ok, fontWeight: '700' },

    seguridad: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: colores.bordes,
        marginBottom: 26,
    },
    seguridadIcono: {
        width: 46,
        height: 46,
        borderRadius: 15,
        backgroundColor: '#E7F8EE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    seguridadTitulo: { fontSize: 15.5, fontWeight: '800', color: colores.texto },
    seguridadTexto: { fontSize: 13, color: colores.texto2, marginTop: 2 },

    grupo: {
        fontSize: 12.5,
        fontWeight: '700',
        color: colores.texto2,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 10,
        marginLeft: 4,
    },
    lista: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colores.bordes,
        overflow: 'hidden',
    },
    opcion: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
    opcionIcono: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    opcionTexto: { fontSize: 15.5, fontWeight: '700', color: colores.texto },
    divisor: { height: 1, backgroundColor: colores.bordes, marginLeft: 68 },

    captura: { padding: 16 },
    capturaFila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    capturaDesc: { fontSize: 13, color: colores.texto2, marginTop: 2, lineHeight: 18 },
    tokenFila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: colores.bordes,
    },
    tokenNombre: { fontSize: 14.5, fontWeight: '700', color: colores.texto },
    tokenDetalle: { fontSize: 12.5, color: colores.texto2, marginTop: 2 },
    botonToken: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: '#E8ECFF',
    },
    botonTokenTexto: { color: colores.acento, fontWeight: '800', fontSize: 14.5 },

    version: { textAlign: 'center', color: colores.placeholder, fontSize: 12.5, marginTop: 30, fontWeight: '600' },

    fondoModal: { flex: 1, backgroundColor: 'rgba(10,15,30,0.45)' },
    hoja: {
        backgroundColor: colores.fondo,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 22,
        paddingBottom: 38,
    },
    agarre: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colores.bordes, marginBottom: 16 },
    tituloHoja: { fontSize: 22, color: colores.texto, fontWeight: '800', marginBottom: 18 },
    error: { color: colores.gasto, textAlign: 'center', marginTop: 10, marginBottom: 4 },
    cancelar: { color: colores.texto2, textAlign: 'center', marginTop: 18, fontWeight: '600' },

    iconoLlave: {
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 14,
    },
    tokenAyuda: { fontSize: 14, color: colores.texto2, textAlign: 'center', lineHeight: 20, marginTop: -8, marginBottom: 18 },
    cajaToken: {
        backgroundColor: colores.tarjeta,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
    },
    tokenTexto: { color: colores.texto, fontSize: 13.5, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
    compartir: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    compartirTexto: { color: colores.acento, fontWeight: '700', fontSize: 14 },
});