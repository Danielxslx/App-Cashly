import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { peticion } from '../../api';
import { obtenerCorreoActual, obtenerNombre } from '../../sesion';
import { categoriaDe, categorias, colores } from '../../tema';

const CATEGORIAS = ['Comida', 'Transporte', 'Ocio', 'Compras', 'Salud', 'Otros'];

const saludo = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
};

const etiquetaDia = (iso: string) => {
    const f = new Date(iso);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    if (f.toDateString() === hoy.toDateString()) return 'Hoy';
    if (f.toDateString() === ayer.toDateString()) return 'Ayer';
    return f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

function Fila({ t, ultima }: { t: any; ultima: boolean }) {
    const declinada = t.status !== 'approved';
    const cat = t.category
        ? categoriaDe(t.category)
        : { color: '#64748B', fondo: '#EAEDF2', icono: t.card ? 'card-outline' : 'cash-outline' };
    return (
        <View style={[styles.fila, !ultima && styles.linea]}>
            <View style={[styles.icono, { backgroundColor: cat.fondo }]}>
                <Ionicons name={cat.icono as any} size={22} color={cat.color} />
            </View>
            <View style={styles.centro}>
                <Text style={styles.comercio} numberOfLines={1}>
                    {t.merchant}
                </Text>
                <Text style={styles.detalle} numberOfLines={1}>
                    {t.category ?? 'Sin categoría'} · {t.card ?? 'Efectivo'}
                    {declinada ? ' · Declinada' : ''}
                </Text>
            </View>
            <View style={styles.derecha}>
                <Text style={[styles.monto, declinada && styles.montoDeclinado]}>
                    − $ {Number(t.amount).toLocaleString('es-CO')}
                </Text>
                {t.occurred_at ? <Text style={styles.fecha}>{etiquetaDia(t.occurred_at)}</Text> : null}
            </View>
        </View>
    );
}

export default function Gastos() {
    const router = useRouter();
    const [nombre, setNombre] = useState('');
    const [transacciones, setTransacciones] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [errorConexion, setErrorConexion] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [comercio, setComercio] = useState('');
    const [monto, setMonto] = useState('');
    const [tipo, setTipo] = useState<'card' | 'cash'>('card');
    const [categoria, setCategoria] = useState('');
    const [errorGasto, setErrorGasto] = useState('');

    const cargar = async () => {
        try {
            const respuesta = await peticion('/transactions');
            const datos = await respuesta.json();
            if (respuesta.ok) {
                setTransacciones(datos.items);
                setErrorConexion('');
            }
        } catch {
            setErrorConexion('No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
    };

    const cargarNombre = async () => {
        const c = await obtenerCorreoActual();
        if (c) {
            setNombre(await obtenerNombre(c));
        }
    };

    const refrescar = async () => {
        setRefrescando(true);
        await cargar();
        setRefrescando(false);
    };

    useFocusEffect(
        useCallback(() => {
            cargar();
            cargarNombre();
        }, [])
    );

    const cerrarModal = () => {
        setModalAbierto(false);
        setErrorGasto('');
        setComercio('');
        setMonto('');
        setTipo('card');
        setCategoria('');
    };

    const agregarGasto = async () => {
        const valor = Number(monto);
        if (!valor || valor <= 0) {
            setErrorGasto('El monto debe ser mayor a 0');
            return;
        }
        if (comercio.trim() === '') {
            setErrorGasto('Escribe el nombre del comercio');
            return;
        }
        setErrorGasto('');
        const base =
            tipo === 'cash'
                ? { merchant: comercio.trim(), amount: valor, type: 'cash' }
                : { merchant: comercio.trim(), amount: valor, card: 'Visa 4421' };
        const cuerpo = categoria ? { ...base, category: categoria } : base;
        try {
            const respuesta = await peticion('/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuerpo),
            });
            if (respuesta.ok) {
                cerrarModal();
                cargar();
            } else {
                const datos = await respuesta.json();
                setErrorGasto(datos.error ?? 'No se pudo guardar el gasto');
            }
        } catch {
            setErrorGasto('No se pudo conectar con el servidor');
        }
    };

    const hoy = new Date();
    const delMes = transacciones.filter((t) => {
        const d = new Date(t.occurred_at);
        return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
    });
    const aprobadas = delMes.filter((t) => t.status === 'approved');
    const declinadas = delMes.length - aprobadas.length;
    const total = aprobadas.reduce((suma, t) => suma + t.amount, 0);
    const ultimas = [...transacciones]
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        .slice(0, 5);

    return (
        <View style={styles.contenedor}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={refrescar}
                        tintColor={colores.texto2}
                    />
                }
            >
                <View style={styles.saludoFila}>
                    <View>
                        <Text style={styles.saludo}>{saludo()}</Text>
                        <Text style={styles.nombre}>{nombre ? `Hola, ${nombre}` : 'Hola'}</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarTexto}>
                            {nombre ? nombre.charAt(0).toUpperCase() : '?'}
                        </Text>
                    </View>
                </View>

                <View style={styles.hero}>
                    <View style={styles.circulo1} />
                    <View style={styles.circulo2} />
                    <Text style={styles.etiqueta}>Gastado este mes</Text>
                    <Text style={styles.total}>$ {total.toLocaleString('es-CO')}</Text>
                    <View style={styles.chips}>
                        <View style={styles.chip}>
                            <Text style={styles.chipTexto}>{delMes.length} movimientos</Text>
                        </View>
                        <View style={styles.chip}>
                            <Text style={styles.chipTexto}>{declinadas} declinadas</Text>
                        </View>
                    </View>
                </View>

                {errorConexion ? <Text style={styles.error}>{errorConexion}</Text> : null}

                <View style={styles.encabezadoSeccion}>
                    <Text style={styles.subtitulo}>Últimas transacciones</Text>
                    <Pressable onPress={() => router.navigate('/transacciones')}>
                        <Text style={styles.verTodas}>Ver todas</Text>
                    </Pressable>
                </View>

                <View style={styles.tarjeta}>
                    {cargando ? (
                        <ActivityIndicator color={colores.acento} style={styles.cargando} />
                    ) : ultimas.length === 0 ? (
                        <Text style={styles.vacio}>
                            Aún no tienes gastos. Toca + para agregar uno.
                        </Text>
                    ) : (
                        ultimas.map((t, i) => (
                            <Fila key={t.id} t={t} ultima={i === ultimas.length - 1} />
                        ))
                    )}
                </View>
            </ScrollView>

            <Pressable style={styles.fab} onPress={() => setModalAbierto(true)}>
                <Ionicons name="add" size={30} color="#FFFFFF" />
            </Pressable>

            <Modal
                visible={modalAbierto}
                animationType="slide"
                transparent
                onRequestClose={cerrarModal}
            >
                <KeyboardAvoidingView
                    style={styles.fondoModal}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.hoja}>
                        <View style={styles.asa} />
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.hojaContenido}
                        >
                            <Text style={styles.tituloHoja}>Nuevo gasto</Text>

                            <View style={styles.selector}>
                                <Pressable
                                    style={[styles.opcionTipo, tipo === 'card' && styles.tipoActivo]}
                                    onPress={() => setTipo('card')}
                                >
                                    <Ionicons
                                        name="card-outline"
                                        size={18}
                                        color={tipo === 'card' ? colores.texto : colores.texto2}
                                    />
                                    <Text
                                        style={[styles.textoTipo, tipo === 'card' && styles.textoTipoActivo]}
                                    >
                                        Tarjeta
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.opcionTipo, tipo === 'cash' && styles.tipoActivo]}
                                    onPress={() => setTipo('cash')}
                                >
                                    <Ionicons
                                        name="cash-outline"
                                        size={18}
                                        color={tipo === 'cash' ? colores.texto : colores.texto2}
                                    />
                                    <Text
                                        style={[styles.textoTipo, tipo === 'cash' && styles.textoTipoActivo]}
                                    >
                                        Efectivo
                                    </Text>
                                </Pressable>
                            </View>

                            <View style={styles.montoFila}>
                                <Text style={styles.signo}>$</Text>
                                <TextInput
                                    style={styles.montoInput}
                                    placeholder="0"
                                    placeholderTextColor="#C5CAD6"
                                    keyboardType="numeric"
                                    value={monto}
                                    onChangeText={setMonto}
                                />
                            </View>
                            <Text style={styles.pie}>Monto del gasto</Text>

                            <Text style={styles.etiquetaCampo}>COMERCIO</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. Rappi"
                                placeholderTextColor={colores.placeholder}
                                value={comercio}
                                onChangeText={setComercio}
                            />

                            <Text style={styles.etiquetaCampo}>CATEGORÍA</Text>
                            <View style={styles.cuadricula}>
                                {CATEGORIAS.map((c) => {
                                    const info = categorias[c];
                                    const activa = categoria === c;
                                    return (
                                        <Pressable
                                            key={c}
                                            style={[
                                                styles.celda,
                                                activa && { borderColor: info.color, backgroundColor: info.fondo },
                                            ]}
                                            onPress={() => setCategoria(activa ? '' : c)}
                                        >
                                            <View style={[styles.celdaIcono, { backgroundColor: info.fondo }]}>
                                                <Ionicons name={info.icono as any} size={18} color={info.color} />
                                            </View>
                                            <Text style={styles.celdaTexto}>{c}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            {errorGasto ? <Text style={styles.error}>{errorGasto}</Text> : null}

                            <Pressable style={styles.boton} onPress={agregarGasto}>
                                <Text style={styles.textoBoton}>Agregar gasto</Text>
                            </Pressable>
                            <Pressable onPress={cerrarModal}>
                                <Text style={styles.cancelar}>Cancelar</Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: colores.fondo,
    },
    saludoFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 70,
        paddingHorizontal: 24,
        marginBottom: 18,
    },
    saludo: {
        fontSize: 14,
        color: colores.texto2,
        fontWeight: '500',
    },
    nombre: {
        fontSize: 28,
        color: colores.texto,
        fontWeight: '800',
        letterSpacing: -0.6,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: '#E8ECFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarTexto: {
        color: colores.acento,
        fontSize: 18,
        fontWeight: '800',
    },
    hero: {
        backgroundColor: colores.heroA,
        marginHorizontal: 20,
        borderRadius: 26,
        padding: 22,
        overflow: 'hidden',
        shadowColor: colores.heroB,
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    circulo1: {
        position: 'absolute',
        right: -50,
        top: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: colores.heroB,
    },
    circulo2: {
        position: 'absolute',
        right: 40,
        bottom: -80,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(76,111,255,0.18)',
    },
    etiqueta: {
        fontSize: 14,
        color: colores.textoGastos,
        opacity: 0.75,
        fontWeight: '500',
    },
    total: {
        fontSize: 42,
        color: colores.textoGastos,
        fontWeight: '800',
        letterSpacing: -1.2,
        marginTop: 4,
    },
    chips: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    chip: {
        backgroundColor: 'rgba(255,255,255,0.14)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    chipTexto: {
        color: colores.textoGastos,
        fontSize: 12.5,
        fontWeight: '600',
    },
    encabezadoSeccion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 24,
        marginTop: 26,
        marginBottom: 12,
    },
    subtitulo: {
        fontSize: 18,
        color: colores.texto,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    verTodas: {
        color: colores.acento,
        fontSize: 14,
        fontWeight: '700',
    },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        paddingHorizontal: 16,
        marginHorizontal: 20,
        marginBottom: 120,
        shadowColor: '#101828',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
    },
    linea: {
        borderBottomWidth: 1,
        borderBottomColor: colores.bordes,
    },
    icono: {
        width: 44,
        height: 44,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centro: {
        flex: 1,
    },
    comercio: {
        fontSize: 15.5,
        fontWeight: '700',
        color: colores.texto,
    },
    detalle: {
        fontSize: 12.5,
        color: colores.texto2,
        marginTop: 2,
    },
    derecha: {
        alignItems: 'flex-end',
    },
    monto: {
        fontSize: 15.5,
        fontWeight: '800',
        color: colores.texto,
    },
    montoDeclinado: {
        color: colores.gasto,
    },
    fecha: {
        fontSize: 12,
        color: colores.texto2,
        marginTop: 2,
    },
    cargando: {
        paddingVertical: 24,
    },
    vacio: {
        color: colores.texto2,
        textAlign: 'center',
        paddingVertical: 28,
    },
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginTop: 12,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: colores.acento,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colores.acento,
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    fondoModal: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(14,21,37,0.5)',
    },
    hoja: {
        backgroundColor: colores.tarjeta,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 22,
        paddingTop: 12,
        maxHeight: '92%',
    },
    asa: {
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#D8DBE5',
        alignSelf: 'center',
        marginBottom: 16,
    },
    hojaContenido: {
        paddingBottom: 36,
    },
    tituloHoja: {
        fontSize: 22,
        color: colores.texto,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    selector: {
        flexDirection: 'row',
        backgroundColor: '#F0F1F6',
        borderRadius: 14,
        padding: 4,
        marginTop: 14,
        marginBottom: 18,
    },
    opcionTipo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 11,
    },
    tipoActivo: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#0E1525',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    textoTipo: {
        color: colores.texto2,
        fontWeight: '700',
        fontSize: 14,
    },
    textoTipoActivo: {
        color: colores.texto,
    },
    montoFila: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    signo: {
        fontSize: 26,
        color: colores.texto2,
        fontWeight: '700',
        marginRight: 6,
    },
    montoInput: {
        fontSize: 46,
        fontWeight: '800',
        letterSpacing: -1.5,
        color: colores.texto,
        minWidth: 90,
        textAlign: 'center',
    },
    pie: {
        textAlign: 'center',
        color: colores.texto2,
        fontSize: 13,
        marginBottom: 18,
    },
    etiquetaCampo: {
        fontSize: 12,
        fontWeight: '700',
        color: colores.texto2,
        letterSpacing: 0.4,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colores.campo,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        color: colores.texto,
        fontSize: 15,
        fontWeight: '600',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginBottom: 18,
    },
    cuadricula: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
        marginBottom: 20,
    },
    celda: {
        width: '31.5%',
        alignItems: 'center',
        gap: 6,
        paddingTop: 12,
        paddingBottom: 10,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colores.bordes,
    },
    celdaIcono: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    celdaTexto: {
        fontSize: 12.5,
        fontWeight: '700',
        color: colores.texto,
    },
    boton: {
        backgroundColor: colores.acento,
        paddingVertical: 17,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: colores.acento,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    textoBoton: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    cancelar: {
        color: colores.texto2,
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '600',
    },
});