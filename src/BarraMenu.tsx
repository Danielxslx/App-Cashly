import { useRouter } from "expo-router";
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { API } from './config';
import { limpiarSesion, obtenerToken } from './sesion';
import { colores } from './tema';

export default function BarraMenu({ titulo }: { titulo: string }) {
    const router = useRouter();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const cerrarSesion = async () => {
        try{
            await fetch(`${API}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${obtenerToken()}` },
            });
        } catch {

        }
        limpiarSesion();
        router.replace('/');
    }

    return (
        <View>
            <View style={styles.barra}>
                <Text style={styles.titulo}>{titulo}</Text>
                <Pressable onPress={() => setMenuAbierto(!menuAbierto)}>
                    <Text style={styles.icono}>☰</Text>
                </Pressable>
            </View>
            {menuAbierto && (
                <View style={styles.menu}>
                    <Pressable style={styles.opcion} onPress={() => router.replace('/gastos')}>
                        <Text style={styles.textoOpcion}>Gastos</Text>
                    </Pressable>
                    <Pressable style={styles.opcion} onPress={() => router.replace('/transacciones')}>
                        <Text style={styles.textoOpcion}>Transacciones</Text>
                    </Pressable>
                    <Pressable style={styles.opcion} onPress={cerrarSesion}>
                        <Text style={styles.textoOpcion}>Cerrar Sesion</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
const styles = StyleSheet.create({
    titulo: {
        fontSize: 28,
        color: colores.texto,
        fontWeight: 'bold',
    },
    barra: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: colores.barra,
    },
    icono: {
        fontSize: 28,
        color: colores.texto,
    },
    menu: {
        backgroundColor: colores.tarjeta,
        borderBottomWidth: 1,
        borderBottomColor: colores.bordes,
    },
    opcion: {
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    textoOpcion: {
        color: colores.texto,
        fontSize: 16,
    },

});