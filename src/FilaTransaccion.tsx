import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores } from './tema';

export default function FilaTransaccion({
    t,
    onLongPress,
}: {
    t: any;
    onLongPress?: () => void;
}) {
    const declinada = t.status === 'declined';
    return (
        <Pressable style={styles.fila} onLongPress={onLongPress}>
            <View style={styles.circulo}>
                <Text style={styles.emoji}>{t.type === 'cash' ? '💵' : '💳'}</Text>
            </View>
            <View style={styles.centro}>
                <Text style={styles.comercio}>{t.merchant}</Text>
                <Text style={styles.detalle}>
                    {t.card ?? 'Efectivo'}
                    {t.category ? ` · ${t.category}` : ''}
                    {declinada ? ' · Declinada' : ''}
                </Text>
            </View>
            <Text style={[styles.monto, declinada && styles.declinada]}>
                $ {t.amount.toLocaleString('es-CO')}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    circulo: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colores.fondo,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    emoji: {
        fontSize: 20,
    },
    centro: {
        flex: 1,
    },
    comercio: {
        fontSize: 16,
        color: colores.texto,
        fontWeight: '600',
    },
    detalle: {
        fontSize: 12,
        color: colores.texto,
        marginTop: 2,
    },
    monto: {
        fontSize: 16,
        color: colores.texto,
        fontWeight: 'bold',
    },
    declinada: {
        color: colores.gasto,
        textDecorationLine: 'line-through',
    },
});