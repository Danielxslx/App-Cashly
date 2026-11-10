import { ReactNode, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { colores } from './tema';

export default function FilaDeslizable({
    children,
    onBorrar,
}: {
    children: ReactNode;
    onBorrar: () => void;
}) {
    const ref = useRef<any>(null);

    const accion = () => (
        <Pressable
            style={styles.botonBorrar}
            onPress={() => {
                ref.current?.close();
                onBorrar();
            }}
        >
            <Text style={styles.textoBorrar}>Borrar</Text>
        </Pressable>
    );

    return (
        <View style={styles.contenedor}>
            <ReanimatedSwipeable
                ref={ref}
                renderRightActions={() => accion()}
                overshootRight={false}
                friction={2}
                rightThreshold={40}
            >
                <View style={styles.fila}>{children}</View>
            </ReanimatedSwipeable>
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        marginHorizontal: -16,
        overflow: 'hidden',
    },
    fila: {
        backgroundColor: colores.tarjeta,
        paddingHorizontal: 16,
    },
    botonBorrar: {
        width: 88,
        backgroundColor: colores.gasto,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textoBorrar: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});