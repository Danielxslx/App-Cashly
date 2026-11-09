import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { API } from '../../config';
import { limpiarSesion, obtenerToken } from '../../sesion';
import { colores } from '../../tema';

export default function Perfil() {
    const router = useRouter();

    const cerrarSesion = async () => {
        try {
            await fetch(`${API}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${obtenerToken()}` },
            });
        } catch {
            // si no hay conexión, igual cerramos la sesión en la app
        }
        limpiarSesion();
        router.replace('/');
    };

    return (
        <View style={styles.contenedor}>
            <View style={styles.avatar}>
                <Text style={styles.emoji}>👤</Text>
            </View>
            <Text style={styles.titulo}>Mi cuenta</Text>
            <Text style={styles.texto}>
                Tu sesión está protegida con verificación en dos pasos.
            </Text>
            <Pressable style={styles.boton} onPress={cerrarSesion}>
                <Text style={styles.textoBoton}>Cerrar sesión</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: colores.fondo,
        alignItems: 'center',
        paddingTop: 120,
        paddingHorizontal: 24,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colores.tarjeta,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 44,
    },
    titulo: {
        fontSize: 26,
        color: colores.texto,
        fontWeight: 'bold',
        marginTop: 16,
    },
    texto: {
        color: colores.texto2,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 40,
    },
    boton: {
        borderWidth: 1,
        borderColor: colores.gasto,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
    },
    textoBoton: {
        color: colores.gasto,
        fontSize: 16,
        fontWeight: 'bold',
    },
});