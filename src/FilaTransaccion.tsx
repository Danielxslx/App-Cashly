import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoriaDe, colores } from './tema';

const etiquetaFecha = (iso: string, modo: 'dia' | 'hora') => {
    const f = new Date(iso);
    if (modo === 'hora') {
        return f.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
    }
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    if (f.toDateString() === hoy.toDateString()) return 'Hoy';
    if (f.toDateString() === ayer.toDateString()) return 'Ayer';
    return f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

export default function FilaTransaccion({
    t,
    onPress,
    onLongPress,
    fecha = 'hora',
    ultima = false,
}: {
    t: any;
    onPress?: () => void;
    onLongPress?: () => void;
    fecha?: 'dia' | 'hora';
    ultima?: boolean;
}) {
    const declinada = t.status !== 'approved';
    const cat = t.category
        ? categoriaDe(t.category)
        : { color: '#64748B', fondo: '#EAEDF2', icono: t.card ? 'card-outline' : 'cash-outline' };

    const contenido = (
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
                {t.occurred_at ? (
                    <Text style={styles.fecha}>{etiquetaFecha(t.occurred_at, fecha)}</Text>
                ) : null}
            </View>
        </View>
    );

    if (onPress || onLongPress) {
        return (
            <Pressable onPress={onPress} onLongPress={onLongPress}>
                {contenido}
            </Pressable>
        );
    }
    return contenido;
}

const styles = StyleSheet.create({
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
});