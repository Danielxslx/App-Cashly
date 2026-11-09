import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { peticion } from '../../api';
import FilaTransaccion from '../../FilaTransaccion';
import { colores } from '../../tema';

const etiquetaDia = (iso: string) => {
    const fecha = new Date(iso);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    if (fecha.toDateString() === hoy.toDateString()) return 'Hoy';
    if (fecha.toDateString() === ayer.toDateString()) return 'Ayer';
    return fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function Transacciones() {
    const [transacciones, setTransacciones] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [errorConexion, setErrorConexion] = useState('');

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

    const ordenadas = [...transacciones].sort(
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
                    <Text style={styles.titulo}>Movimientos</Text>
                    <Text style={styles.ayuda}>Mantén presionado un gasto para eliminarlo</Text>
                </View>

                {errorConexion ? <Text style={styles.error}>{errorConexion}</Text> : null}

                {cargando ? (
                    <ActivityIndicator color={colores.acento2} style={styles.cargando} />
                ) : grupos.length === 0 ? (
                    <Text style={styles.vacio}>Aún no tienes movimientos.</Text>
                ) : (
                    grupos.map((g) => (
                        <View key={g.dia}>
                            <Text style={styles.dia}>{g.dia}</Text>
                            <View style={styles.tarjeta}>
                                {g.items.map((t) => (
                                    <FilaTransaccion
                                        key={t.id}
                                        t={t}
                                        onLongPress={() => confirmarEliminar(t.id)}
                                    />
                                ))}
                            </View>
                        </View>
                    ))
                )}
                <View style={styles.espacio} />
            </ScrollView>
        </View>
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
});