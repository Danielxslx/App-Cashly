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
import { colores } from '../../tema';

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
        if (comercio.trim() === '') {
            setErrorEdicion('Escribe el nombre del comercio');
            return;
        }
        if (!valor || valor <= 0) {
            setErrorEdicion('El monto debe ser mayor a 0');
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
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={refrescar}
                        tintColor={colores.texto}
                    />
                }
            >
                <View style={styles.cabecera}>
                    <Text style={styles.titulo}>Movimientos</Text>
                    <Text style={styles.ayuda}>
                        Toca un gasto para editarlo · Deslízalo a la izquierda para eliminarlo
                    </Text>
                </View>

                <View style={styles.zonaBusqueda}>
                    <TextInput
                        style={styles.buscador}
                        placeholder="🔍  Buscar por comercio o categoría"
                        placeholderTextColor="#9CA3AF"
                        value={busqueda}
                        onChangeText={setBusqueda}
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.filaChips}
                    >
                        <Pressable
                            style={[styles.chipFiltro, filtroCategoria === '' && styles.opcionActiva]}
                            onPress={() => setFiltroCategoria('')}
                        >
                            <Text style={styles.textoTipo}>Todas</Text>
                        </Pressable>
                        {CATEGORIAS.map((c) => (
                            <Pressable
                                key={c}
                                style={[styles.chipFiltro, filtroCategoria === c && styles.opcionActiva]}
                                onPress={() => setFiltroCategoria(filtroCategoria === c ? '' : c)}
                            >
                                <Text style={styles.textoTipo}>{c}</Text>
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
                </View>

                {errorConexion ? <Text style={styles.error}>{errorConexion}</Text> : null}

                {cargando ? (
                    <ActivityIndicator color={colores.acento2} style={styles.cargando} />
                ) : grupos.length === 0 ? (
                    <Text style={styles.vacio}>
                        {hayFiltro
                            ? 'No encontramos gastos con ese filtro.'
                            : 'Aún no tienes movimientos.'}
                    </Text>
                ) : (
                    grupos.map((g) => (
                        <View key={g.dia}>
                            <Text style={styles.dia}>{g.dia}</Text>
                            <View style={styles.tarjeta}>
                                {g.items.map((t) => (
                                    <FilaDeslizable key={t.id} onBorrar={() => confirmarEliminar(t.id)}>
                                        <FilaTransaccion t={t} onPress={() => abrirEdicion(t)} />
                                    </FilaDeslizable>
                                ))}
                            </View>
                        </View>
                    ))
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
                        <Text style={styles.tituloHoja}>Editar gasto</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Comercio"
                            placeholderTextColor="#9CA3AF"
                            value={comercio}
                            onChangeText={setComercio}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Monto"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={monto}
                            onChangeText={setMonto}
                        />

                        <Text style={styles.etiquetaCat}>Categoría</Text>
                        <View style={styles.categorias}>
                            {CATEGORIAS.map((c) => (
                                <Pressable
                                    key={c}
                                    style={[styles.catChip, categoria === c && styles.opcionActiva]}
                                    onPress={() => setCategoria(categoria === c ? '' : c)}
                                >
                                    <Text style={styles.textoTipo}>{c}</Text>
                                </Pressable>
                            ))}
                        </View>

                        {errorEdicion ? <Text style={styles.error}>{errorEdicion}</Text> : null}

                        <Pressable style={styles.boton} onPress={guardarEdicion}>
                            <Text style={styles.textoBoton}>Guardar cambios</Text>
                        </Pressable>
                        <Pressable onPress={cerrarEdicion}>
                            <Text style={styles.cancelar}>Cancelar</Text>
                        </Pressable>
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
        paddingBottom: 8,
    },
    titulo: {
        fontSize: 30,
        color: colores.texto,
        fontWeight: 'bold',
    },
    ayuda: {
        color: colores.texto2,
        fontSize: 12,
        marginTop: 4,
    },
    zonaBusqueda: {
        marginTop: 8,
    },
    buscador: {
        backgroundColor: colores.tarjeta,
        color: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginHorizontal: 20,
    },
    filaChips: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    chipFiltro: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: colores.tarjeta,
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
        color: colores.acento2,
        fontSize: 13,
        fontWeight: '600',
    },
    dia: {
        color: colores.texto2,
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
        marginHorizontal: 24,
        marginTop: 20,
        marginBottom: 8,
    },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        paddingHorizontal: 16,
        marginHorizontal: 20,
        overflow: 'hidden',
    },
    cargando: {
        marginTop: 40,
    },
    vacio: {
        color: colores.texto2,
        textAlign: 'center',
        marginTop: 40,
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
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    hoja: {
        backgroundColor: colores.tarjeta,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
    },
    tituloHoja: {
        fontSize: 22,
        color: colores.texto,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#2A2A3A',
        color: '#FFFFFF',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    etiquetaCat: {
        color: colores.texto2,
        fontSize: 13,
        marginBottom: 8,
    },
    categorias: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    catChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: colores.fondo,
    },
    opcionActiva: {
        backgroundColor: colores.acento,
    },
    textoTipo: {
        color: colores.texto,
        fontWeight: '600',
    },
    boton: {
        backgroundColor: colores.acento,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    textoBoton: {
        color: colores.texto,
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelar: {
        color: colores.texto2,
        textAlign: 'center',
        marginTop: 16,
    },
});