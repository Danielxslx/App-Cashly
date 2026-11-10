import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { peticion } from '../../api';
import { API } from '../../config';
import {
    guardarRefresh,
    guardarToken,
    limpiarSesion,
    obtenerCorreoActual,
    obtenerNombre,
    obtenerToken,
} from '../../sesion';
import { colores } from '../../tema';

export default function Perfil() {
    const router = useRouter();
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [errorClave, setErrorClave] = useState('');
    const [aviso, setAviso] = useState('');

    useFocusEffect(
        useCallback(() => {
            const cargarDatos = async () => {
                const c = await obtenerCorreoActual();
                setCorreo(c);
                if (c) {
                    setNombre(await obtenerNombre(c));
                }
            };
            cargarDatos();
        }, [])
    );

    const cerrarModal = () => {
        setModalAbierto(false);
        setActual('');
        setNueva('');
        setErrorClave('');
    };

    const cambiarClave = async () => {
        if (actual === '') {
            setErrorClave('Escribe tu contraseña actual');
            return;
        }
        if (nueva.length < 10) {
            setErrorClave('La contraseña nueva debe tener mínimo 10 caracteres');
            return;
        }
        if (nueva === actual) {
            setErrorClave('La contraseña nueva debe ser distinta de la actual');
            return;
        }
        setErrorClave('');
        try {
            const respuesta = await peticion('/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: actual, newPassword: nueva }),
            });
            const datos = await respuesta.json();
            if (respuesta.ok) {
                guardarToken(datos.accessToken);
                guardarRefresh(datos.refreshToken);
                cerrarModal();
                setAviso('Contraseña actualizada ✅');
            } else {
                setErrorClave(datos.error ?? 'No se pudo cambiar la contraseña');
            }
        } catch {
            setErrorClave('No se pudo conectar con el servidor');
        }
    };

    const cerrarSesion = async () => {
        const token = obtenerToken();
        // avisamos al servidor sin esperar su respuesta
        fetch(`${API}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {
            // si no hay conexión, igual cerramos la sesión en la app
        });
        await limpiarSesion();
        router.replace('/');
    };

    return (
        <View style={styles.contenedor}>
            <View style={styles.avatar}>
                <Text style={styles.emoji}>👤</Text>
            </View>
            <Text style={styles.titulo}>{nombre ? `Hola, ${nombre}` : 'Hola'}</Text>
            {correo ? <Text style={styles.correo}>{correo}</Text> : null}
            <Text style={styles.texto}>
                Tu sesión está protegida con verificación en dos pasos.
            </Text>
            {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

            <Pressable
                style={styles.botonSecundario}
                onPress={() => {
                    setAviso('');
                    setModalAbierto(true);
                }}
            >
                <Text style={styles.textoSecundario}>Cambiar contraseña</Text>
            </Pressable>

            <Pressable style={styles.boton} onPress={cerrarSesion}>
                <Text style={styles.textoBoton}>Cerrar sesión</Text>
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
                        <Text style={styles.tituloHoja}>Cambiar contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña actual"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            value={actual}
                            onChangeText={setActual}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña nueva (mín. 10 caracteres)"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            value={nueva}
                            onChangeText={setNueva}
                        />
                        {errorClave ? <Text style={styles.error}>{errorClave}</Text> : null}
                        <Pressable style={styles.botonGuardar} onPress={cambiarClave}>
                            <Text style={styles.textoGuardar}>Guardar</Text>
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
    correo: {
        fontSize: 14,
        color: colores.texto2,
        marginTop: 4,
    },
    texto: {
        color: colores.texto2,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    aviso: {
        color: '#22C55E',
        textAlign: 'center',
        marginBottom: 16,
    },
    botonSecundario: {
        borderWidth: 1,
        borderColor: colores.acento2,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
        marginBottom: 14,
    },
    textoSecundario: {
        color: colores.acento2,
        fontSize: 16,
        fontWeight: 'bold',
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
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginBottom: 8,
    },
    botonGuardar: {
        backgroundColor: colores.acento,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    textoGuardar: {
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