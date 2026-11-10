import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { peticion } from '../../api';
import FilaDeslizable from '../../FilaDeslizable';
import FilaTransaccion from '../../FilaTransaccion';
import { categorias, colores } from '../../tema';

const CATEGORIAS = ['Comida', 'Transporte', 'Ocio', 'Compras', 'Salud', 'Otros'];

const etiquetaDia = (iso: string) => {
    const fecha = new Date(iso);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    if (fecha.toDateString() === hoy.toDateString()) return 'Hoy';
    if (fecha.toDateString() === ayer.toDateString()) return 'Ayer';
    return fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
};

const limpiar = (texto: string) =>
    texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

export default function Transacciones() {
    const [transacciones, setTransacciones] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [errorConexion, setErrorConexion] = useState('');
    const [editando, setEditando] = useState<any>(null);
    const [comercio, setComercio] = useState('');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [errorEdicion, setErrorEdicion] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');

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

    const refrescar = async () => {
        setRefrescando(true);
        await cargar();
        setRefrescando(false);
    };

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [])
    );

    const eliminarGasto = async (id: string) => {
        try {
            const respuesta = await peticion(`/transactions/${id}`, { method: 'DELETE' });
            if (respuesta.ok) {
                cargar();
            }
        } catch {
            setErrorConexion('No se pudo conectar con el servidor');
        }
    };

    const confirmarEliminar = (id: string) => {
        Alert.alert('Eliminar gasto', '¿Seguro que quieres eliminar este gasto?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => eliminarGasto(id) },
        ]);
    };

    const abrirEdicion = (t: any) => {
        setEditando(t);
        setComercio(t.merchant);
        setMonto(String(t.amount));
        setCategoria(t.category ?? '');
        setErrorEdicion('');
    };

    const cerrarEdicion = () => {
        setEditando(null);
        setErrorEdicion('');
    };

    const guardarEdicion = async () => {
        const valor = Number(monto);
        if (!valor || valor <= 0) {
            setErrorEdicion('El monto debe ser mayor a 0');
            return;
        }
        if (comercio.trim() === '') {
            setErrorEdicion('Escribe el nombre del comercio');
            return;
        }
        setErrorEdicion('');
        try {
            const respuesta = await peticion(`/transactions/${editando.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchant: comercio.trim(),
                    amount: valor,
                    category: categoria === '' ? null : categoria,
                }),
            });
            if (respuesta.ok) {
                cerrarEdicion();
                cargar();
            } else {
                const datos = await respuesta.json();
                setErrorEdicion(datos.error ?? 'No se pudo guardar los cambios');
            }
        } catch {
            setErrorEdicion('No se pudo conectar con el servidor');
        }
    };

    const hayFiltro = busqueda.trim() !== '' || filtroCategoria !== '';

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroCategoria('');
    };

    const texto = limpiar(busqueda.trim());

    const filtradas = transacciones.filter((t) => {
        if (filtroCategoria && t.category !== filtroCategoria) return false;
        if (texto) {
            const campos = limpiar(`${t.merchant ?? ''} ${t.category ?? ''} ${t.card ?? ''}`);
            if (!campos.includes(texto)) return false;
        }
        return true;
    });

    const ordenadas = [...filtradas].sort(
        (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    );

    const grupos: { dia: string; items: any[] }[] = [];
    ordenadas.forEach((t) => {
        const dia = etiquetaDia(t.occurred_at);
        const ultimo = grupos[grupos.length - 1];
        if (ultimo && ultimo.dia === dia) {
            ultimo.items.push(t);
        } else {
            grupos.push({ dia, items: [t] });
        }
    });

    return (
        <GestureHandlerRootView style={styles.contenedor}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={refrescar}
                        tintColor={colores.texto2}
                    />
                }
            >
                <View style={styles.cabecera}>
                    <Text style={styles.titulo}>Movimientos</Text>
                    <Text style={styles.ayuda}>
                        Toca para editar · Desliza a la izquierda para borrar
                    </Text>
                </View>

                <View style={styles.buscador}>
                    <Ionicons name="search-outline" size={20} color={colores.placeholder} />
                    <TextInput
                        style={styles.buscadorInput}
                        placeholder="Buscar comercio o categoría"
                        placeholderTextColor={colores.placeholder}
                        value={busqueda}
                        onChangeText={setBusqueda}
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    {busqueda !== '' ? (
                        <Pressable onPress={() => setBusqueda('')}>
                            <Ionicons name="close-circle" size={18} color={colores.placeholder} />
                        </Pressable>
                    ) : null}
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.filaChips}
                >
                    <Pressable
                        style={[styles.chipFiltro, filtroCategoria === '' && styles.chipActivo]}
                        onPress={() => setFiltroCategoria('')}
                    >
                        <Text style={[styles.chipTexto, filtroCategoria === '' && styles.chipTextoActivo]}>
                            Todas
                        </Text>
                    </Pressable>
                    {CATEGORIAS.map((c) => (
                        <Pressable
                            key={c}
                            style={[styles.chipFiltro, filtroCategoria === c && styles.chipActivo]}
                            onPress={() => setFiltroCategoria(filtroCategoria === c ? '' : c)}
                        >
                            <Text
                                style={[styles.chipTexto, filtroCategoria === c && styles.chipTextoActivo]}
                            >
                                {c}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {hayFiltro && !cargando ? (
                    <View style={styles.resumenFiltro}>
                        <Text style={styles.textoResumen}>
                            {filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}
                        </Text>
                        <Pressable onPress={limpiarFiltros}>
                            <Text style={styles.limpiar}>Limpiar filtros</Text>
                        </Pressable>
                    </View>
                ) : null}

                {errorConexion ? <Text style={styles.error}>{errorConexion}</Text> : null}

                {cargando ? (
                    <ActivityIndicator color={colores.acento} style={styles.cargando} />
                ) : grupos.length === 0 ? (
                    <View style={styles.vacioCaja}>
                        <Ionicons name="receipt-outline" size={44} color="#C5CAD6" />
                        <Text style={styles.vacio}>
                            {hayFiltro
                                ? 'No encontramos gastos con ese filtro.'
                                : 'Aún no tienes movimientos.'}
                        </Text>
                    </View>
                ) : (
                    grupos.map((g) => {
                        const totalDia = g.items
                            .filter((t) => t.status === 'approved')
                            .reduce((suma, t) => suma + t.amount, 0);
                        return (
                            <View key={g.dia}>
                                <View style={styles.diaFila}>
                                    <Text style={styles.dia}>{g.dia}</Text>
                                    <Text style={styles.diaTotal}>
                                        − $ {totalDia.toLocaleString('es-CO')}
                                    </Text>
                                </View>
                                <View style={styles.tarjeta}>
                                    {g.items.map((t, i) => (
                                        <FilaDeslizable key={t.id} onBorrar={() => confirmarEliminar(t.id)}>
                                            <FilaTransaccion
                                                t={t}
                                                onPress={() => abrirEdicion(t)}
                                                ultima={i === g.items.length - 1}
                                            />
                                        </FilaDeslizable>
                                    ))}
                                </View>
                            </View>
                        );
                    })
                )}
                <View style={styles.espacio} />
            </ScrollView>

            <Modal
                visible={editando !== null}
                animationType="slide"
                transparent
                onRequestClose={cerrarEdicion}
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
                            <Text style={styles.tituloHoja}>Editar gasto</Text>

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
                                placeholder="Comercio"
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

                            {errorEdicion ? <Text style={styles.error}>{errorEdicion}</Text> : null}

                            <Pressable style={styles.boton} onPress={guardarEdicion}>
                                <Text style={styles.textoBoton}>Guardar cambios</Text>
                            </Pressable>
                            <Pressable onPress={cerrarEdicion}>
                                <Text style={styles.cancelar}>Cancelar</Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: colores.fondo,
    },
    cabecera: {
        paddingTop: 70,
        paddingHorizontal: 24,
    },
    titulo: {
        fontSize: 28,
        color: colores.texto,
        fontWeight: '800',
        letterSpacing: -0.6,
    },
    ayuda: {
        color: colores.texto2,
        fontSize: 13,
        marginTop: 4,
    },
    buscador: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colores.tarjeta,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 13,
        marginHorizontal: 20,
        marginTop: 16,
    },
    buscadorInput: {
        flex: 1,
        color: colores.texto,
        fontSize: 15,
        padding: 0,
    },
    filaChips: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    chipFiltro: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 999,
        backgroundColor: colores.tarjeta,
        borderWidth: 1.5,
        borderColor: colores.bordes,
    },
    chipActivo: {
        backgroundColor: colores.texto,
        borderColor: colores.texto,
    },
    chipTexto: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#4A5369',
    },
    chipTextoActivo: {
        color: '#FFFFFF',
    },
    resumenFiltro: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 24,
    },
    textoResumen: {
        color: colores.texto2,
        fontSize: 13,
    },
    limpiar: {
        color: colores.acento,
        fontSize: 13,
        fontWeight: '700',
    },
    diaFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 24,
        marginTop: 20,
        marginBottom: 10,
    },
    dia: {
        color: colores.texto2,
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    diaTotal: {
        color: colores.texto2,
        fontSize: 13,
        fontWeight: '700',
    },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        paddingHorizontal: 16,
        marginHorizontal: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colores.bordes,
    },
    cargando: {
        marginTop: 40,
    },
    vacioCaja: {
        alignItems: 'center',
        marginTop: 50,
        gap: 12,
    },
    vacio: {
        color: colores.texto2,
        textAlign: 'center',
    },
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginTop: 12,
    },
    espacio: {
        height: 40,
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
        marginBottom: 10,
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