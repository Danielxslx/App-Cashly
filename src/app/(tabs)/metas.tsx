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
import { peticion } from '../../api';
import { colores } from '../../tema';

const colorEstado = (estado: string) => {
    if (estado === 'exceeded') return colores.gasto;
    if (estado === 'warning') return '#F59E0B';
    return '#22C55E';
};

const CATEGORIAS = ['Comida', 'Transporte', 'Ocio', 'Compras', 'Salud', 'Otros'];

export default function Metas() {
    const [metas, setMetas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [categoria, setCategoria] = useState('');
    const [limite, setLimite] = useState('');
    const [errorMeta, setErrorMeta] = useState('');

    const cargar = async () => {
        try {
            const respuesta = await peticion('/goals/progress');
            const datos = await respuesta.json();
            if (respuesta.ok) {
                setMetas(datos.goals);
                setError('');
            } else {
                setError(datos.error ?? 'No se pudieron cargar las metas');
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
    };

    const refrescar = async () => {
        setRefrescando(true);
        await cargar();
        setRefrescando(false);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setCategoria('');
        setLimite('');
        setErrorMeta('');
    };

    const crearMeta = async () => {
        const valor = Number(limite);
        if (!valor || valor <= 0) {
            setErrorMeta('El límite debe ser mayor a 0');
            return;
        }
        setErrorMeta('');
        const cuerpo = categoria ? { limit: valor, category: categoria } : { limit: valor };
        try {
            const respuesta = await peticion('/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuerpo),
            });
            if (respuesta.ok) {
                cerrarModal();
                cargar();
            } else {
                const datos = await respuesta.json();
                setErrorMeta(datos.error ?? 'No se pudo crear la meta');
            }
        } catch {
            setErrorMeta('No se pudo conectar con el servidor');
        }
    };

    const borrarMeta = async (id: string) => {
        try {
            const respuesta = await peticion(`/goals/${id}`, { method: 'DELETE' });
            if (respuesta.ok) {
                cargar();
            } else {
                setError('No se pudo borrar la meta');
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        }
    };

    const confirmarBorrado = (m: any) => {
        Alert.alert(
            'Borrar meta',
            `¿Quieres borrar la meta de ${m.category ?? 'Gasto total'}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Borrar', style: 'destructive', onPress: () => borrarMeta(m.id) },
            ]
        );
    };

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [])
    );

    return (
        <View style={styles.contenedor}>
            <ScrollView
                style={styles.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={refrescar}
                        tintColor="#FFFFFF"
                    />
                }
            >
                <View style={styles.cabecera}>
                    <Text style={styles.titulo}>Metas del mes</Text>
                    <Text style={styles.subtituloCab}>Controla cuánto gastas en cada categoría</Text>
                </View>

                <View style={styles.cuerpo}>
                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    {cargando ? (
                        <ActivityIndicator color={colores.acento2} style={styles.cargando} />
                    ) : metas.length === 0 ? (
                        <Text style={styles.vacio}>Aún no tienes metas.</Text>
                    ) : (
                        metas.map((m) => {
                            const color = colorEstado(m.status);
                            const ancho = Math.min(m.percent, 100);
                            return (
                                <Pressable
                                    key={m.id}
                                    style={styles.tarjeta}
                                    onLongPress={() => confirmarBorrado(m)}
                                >
                                    <View style={styles.fila}>
                                        <Text style={styles.nombre}>{m.category ?? 'Gasto total'}</Text>
                                        <Text style={[styles.porcentaje, { color }]}>{m.percent}%</Text>
                                    </View>
                                    <View style={styles.barraFondo}>
                                        <View style={[styles.barra, { width: `${ancho}%`, backgroundColor: color }]} />
                                    </View>
                                    <View style={styles.fila}>
                                        <Text style={styles.detalle}>
                                            $ {m.spent.toLocaleString('es-CO')} de $ {m.limit.toLocaleString('es-CO')}
                                        </Text>
                                        <Text style={[styles.detalle, m.remaining < 0 && { color: colores.gasto }]}>
                                            {m.remaining >= 0
                                                ? `Quedan $ ${m.remaining.toLocaleString('es-CO')}`
                                                : `Te pasaste $ ${Math.abs(m.remaining).toLocaleString('es-CO')}`}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })
                    )}
                    <View style={{ height: 110 }} />
                </View>
            </ScrollView>

            <Pressable style={styles.fab} onPress={() => setModalAbierto(true)}>
                <Text style={styles.fabTexto}>+</Text>
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
                        <Text style={styles.tituloHoja}>Nueva meta</Text>

                        <Text style={styles.etiquetaCat}>¿Sobre qué?</Text>
                        <View style={styles.categorias}>
                            <Pressable
                                style={[styles.catChip, categoria === '' && styles.opcionActiva]}
                                onPress={() => setCategoria('')}
                            >
                                <Text style={styles.textoTipo}>Gasto total</Text>
                            </Pressable>
                            {CATEGORIAS.map((c) => (
                                <Pressable
                                    key={c}
                                    style={[styles.catChip, categoria === c && styles.opcionActiva]}
                                    onPress={() => setCategoria(c)}
                                >
                                    <Text style={styles.textoTipo}>{c}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Límite mensual (ej. 500000)"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={limite}
                            onChangeText={setLimite}
                        />
                        {errorMeta ? <Text style={styles.error}>{errorMeta}</Text> : null}

                        <Pressable style={styles.boton} onPress={crearMeta}>
                            <Text style={styles.textoBoton}>Crear meta</Text>
                        </Pressable>
                        <Pressable onPress={cerrarModal}>
                            <Text style={styles.cancelar}>Cancelar</Text>
                        </Pressable>
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
    scroll: {
        backgroundColor: colores.acento2,
    },
    cabecera: {
        backgroundColor: colores.acento2,
        paddingTop: 70,
        paddingBottom: 28,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: -32,
        zIndex: 1,
    },
    cuerpo: {
        backgroundColor: colores.fondo,
        minHeight: 1000,
        paddingTop: 52,
    },
    titulo: {
        fontSize: 28,
        color: colores.textoGastos,
        fontWeight: 'bold',
    },
    subtituloCab: {
        fontSize: 14,
        color: colores.textoGastos,
        opacity: 0.8,
        marginTop: 4,
    },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        padding: 18,
        marginHorizontal: 20,
        marginBottom: 14,
    },
    fila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nombre: {
        fontSize: 17,
        color: colores.texto,
        fontWeight: 'bold',
    },
    porcentaje: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    barraFondo: {
        height: 10,
        borderRadius: 5,
        backgroundColor: colores.fondo,
        marginVertical: 12,
        overflow: 'hidden',
    },
    barra: {
        height: 10,
        borderRadius: 5,
    },
    detalle: {
        fontSize: 12,
        color: colores.texto,
    },
    cargando: {
        paddingVertical: 24,
    },
    vacio: {
        color: colores.texto,
        textAlign: 'center',
        paddingVertical: 24,
    },
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginBottom: 12,
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colores.acento,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    fabTexto: {
        color: colores.texto,
        fontSize: 32,
        lineHeight: 36,
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
    etiquetaCat: {
        color: colores.texto,
        fontSize: 13,
        marginBottom: 8,
    },
    categorias: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
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
    input: {
        backgroundColor: '#2A2A3A',
        color: '#FFFFFF',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
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
        color: colores.texto,
        textAlign: 'center',
        marginTop: 16,
    },
});