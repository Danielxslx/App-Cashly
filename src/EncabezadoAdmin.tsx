import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { API } from './config';
import { limpiarSesion, obtenerToken } from './sesion';
import { colores } from './tema';

export function EncabezadoAdmin({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
    const router = useRouter();

    const salir = () => {
        Alert.alert('Cerrar sesión', '¿Quieres salir del panel de administrador?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Salir',
                style: 'destructive',
                onPress: async () => {
                    const token = obtenerToken();
                    fetch(`${API}/auth/logout`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                    }).catch(() => {
                        // sin conexión igual cerramos la sesión en la app
                    });
                    await limpiarSesion();
                    router.replace('/');
                },
            },
        ]);
    };

    return (
        <View style={s.barra}>
            <View style={{ flex: 1 }}>
                <View style={s.insignia}>
                    <Ionicons name="shield-checkmark" size={12} color={colores.acento} />
                    <Text style={s.insigniaTexto}>ADMINISTRADOR</Text>
                </View>
                <Text style={s.titulo}>{titulo}</Text>
                {subtitulo ? <Text style={s.subtitulo}>{subtitulo}</Text> : null}
            </View>
            <Pressable onPress={salir} hitSlop={12} style={s.salir}>
                <Ionicons name="log-out-outline" size={22} color={colores.gasto} />
            </Pressable>
        </View>
    );
}

const s = StyleSheet.create({
    barra: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 14,
    },
    insignia: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: '#E8ECFF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginBottom: 6,
    },
    insigniaTexto: { fontSize: 10.5, fontWeight: '800', color: colores.acento, letterSpacing: 0.6 },
    titulo: { fontSize: 26, fontWeight: '800', color: colores.texto, letterSpacing: -0.6 },
    subtitulo: { fontSize: 13, color: colores.texto2, marginTop: 2 },
    salir: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: colores.tarjeta,
        borderWidth: 1,
        borderColor: colores.bordes,
        alignItems: 'center',
        justifyContent: 'center',
    },
});