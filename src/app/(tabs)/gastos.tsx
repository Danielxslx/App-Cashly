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
import FilaTransaccion from '../../FilaTransaccion';
import { colores } from '../../tema';

const CATEGORIAS = ['Comida', 'Transporte', 'Ocio', 'Compras', 'Salud', 'Otros'];
export default function Gastos() {
    const router = useRouter();
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
        if (comercio.trim() === '') {
            setErrorGasto('Escribe el nombre del comercio');
            return;
        }
        if (!valor || valor <= 0) {
            setErrorGasto('El monto debe ser mayor a 0');
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

    const aprobadas = transacciones.filter((t) => t.status === 'approved');
    const declinadas = transacciones.length - aprobadas.length;
    const total = aprobadas.reduce((suma, t) => suma + t.amount, 0);
    const ultimas = [...transacciones]
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        .slice(0, 5);

    return (
        <View style={styles.contenedor}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={refrescar}
                        tintColor={colores.texto}
                    />
                }
            >
                <View style={styles.cabecera}>
                    <Text style={styles.etiqueta}>Total gastado</Text>
                    <Text style={styles.total}>$ {total.toLocaleString('es-CO')}</Text>
                    <View style={styles.chips}>
                        <View style={styles.chip}>
                            <Text style={styles.chipTexto}>{transacciones.length} movimientos</Text>
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
                        <ActivityIndicator color={colores.acento2} style={styles.cargando} />
                    ) : ultimas.length === 0 ? (
                        <Text style={styles.vacio}>Aún no tienes gastos. Toca + para agregar uno.</Text>
                    ) : (
                        ultimas.map((t) => <FilaTransaccion key={t.id} t={t} />)
                    )}
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
                        <Text style={styles.tituloHoja}>Nuevo gasto</Text>

                        <View style={styles.selector}>
                            <Pressable
                                style={[styles.opcionTipo, tipo === 'card' && styles.opcionActiva]}
                                onPress={() => setTipo('card')}
                            >
                                <Text style={styles.textoTipo}>💳 Tarjeta</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.opcionTipo, tipo === 'cash' && styles.opcionActiva]}
                                onPress={() => setTipo('cash')}
                            >
                                <Text style={styles.textoTipo}>💵 Efectivo</Text>
                            </Pressable>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Comercio"
                            placeholderTextColor={colores.texto2}
                            value={comercio}
                            onChangeText={setComercio}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Monto (ej. 25000)"
                            placeholderTextColor={colores.texto2}
                            keyboardType="numeric"
                            value={monto}
                            onChangeText={setMonto}
                        />
                        <Text style={styles.etiquetaCat}>Categoria</Text>
                        <View style={styles.categoria}>
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
                        {errorGasto ? <Text style={styles.error}>{errorGasto}</Text> : null}

                        <Pressable style={styles.boton} onPress={agregarGasto}>
                            <Text style={styles.textoBoton}>Agregar</Text>
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
    cabecera: {
        backgroundColor: colores.acento2,
        paddingTop: 70,
        paddingBottom: 28,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    etiqueta: {
        fontSize: 14,
        color: colores.textoGastos,
        opacity: 0.8,
    },
    total: {
        fontSize: 40,
        color: colores.textoGastos,
        fontWeight: 'bold',
        marginTop: 4,
    },
    chips: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    chip: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    chipTexto: {
        color: colores.textoGastos,
        fontSize: 12,
        fontWeight: '600',
    },
    encabezadoSeccion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 24,
        marginTop: 24,
        marginBottom: 12,
    },
    subtitulo: {
        fontSize: 18,
        color: colores.texto,
        fontWeight: 'bold',
    },
    verTodas: {
        color: colores.acento2,
        fontSize: 14,
    },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        paddingHorizontal: 16,
        marginHorizontal: 20,
        marginBottom: 120,
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
        marginTop: 12,
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
    selector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    opcionTipo: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: colores.fondo,
    },
    opcionActiva: {
        backgroundColor: colores.acento,
    },
    textoTipo: {
        color: colores.texto,
        fontWeight: '600',
    },
    etiquetaCat: {
      color: colores.texto,
      fontSize: 13,
      marginBottom: 8,  
    },
    categoria: {
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
    input: {
        backgroundColor: colores.fondo,
        color: colores.texto,
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
        color: colores.texto2,
        textAlign: 'center',
        marginTop: 16,
    },
});