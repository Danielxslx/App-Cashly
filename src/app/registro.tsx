import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { API } from '../config';
import { guardarNombre } from '../sesion';
import { colores } from '../tema';
import { Boton, Campo, Logo, PantallaAuth } from '../ui';

export default function Register() {
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [clave, setClave] = useState('');
    const router = useRouter();
    const [claveRecuperacion, setClaveRecuperacion] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    const registrarse = async () => {
        setError('');
        if (!/^\S+@\S+\.\S+$/.test(correo)) {
            setError('Escribe un correo válido');
            return;
        }
        if (clave.length < 10) {
            setError('La contraseña debe tener mínimo 10 caracteres');
            return;
        }
        setEnviando(true);
        try {
            const respuesta = await fetch(`${API}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: correo, password: clave }),
            });
            const texto = await respuesta.text();
            let datos: any = {};
            try {
                datos = JSON.parse(texto);
            } catch {
                setError('El servidor respondió algo inesperado');
                return;
            }
            if (respuesta.ok) {
                guardarNombre(correo, nombre);
                setClaveRecuperacion(datos.recoveryKey);
            } else {
                setError(datos.error);
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setEnviando(false);
        }
    };

    const compartirClave = () => {
        Share.share({ message: `Mi clave de recuperación de Cashly: ${claveRecuperacion}` });
    };

    if (claveRecuperacion) {
        return (
            <PantallaAuth>
                <View style={styles.iconoLlave}>
                    <Ionicons name="key-outline" size={34} color="#B45309" />
                </View>
                <Text style={styles.titulo}>Guarda tu clave de recuperación</Text>
                <Text style={styles.subtitulo}>
                    Solo se muestra una vez. Si olvidas tu contraseña, es lo único que te permite
                    recuperar tu cuenta.
                </Text>
                <View style={styles.cajaClave}>
                    <Text selectable style={styles.clave}>
                        {claveRecuperacion}
                    </Text>
                </View>
                <Pressable style={styles.compartir} onPress={compartirClave}>
                    <Ionicons name="share-outline" size={18} color={colores.acento} />
                    <Text style={styles.compartirTexto}>Guardar o compartir</Text>
                </Pressable>
                <Boton
                    texto="Ya la guardé"
                    onPress={() => router.replace({ pathname: '/verificar', params: { correo } })}
                />
            </PantallaAuth>
        );
    }

    return (
        <PantallaAuth>
            <View style={styles.logoCaja}>
                <Logo tam={64} />
            </View>
            <Text style={styles.titulo}>Crea tu cuenta</Text>
            <Text style={styles.subtitulo}>Regístrate para vivir la experiencia completa</Text>

            <Campo
                icono="person-outline"
                placeholder="Nombre de usuario"
                value={nombre}
                onChangeText={setNombre}
            />
            <Campo
                icono="mail-outline"
                placeholder="Correo electrónico"
                autoCapitalize="none"
                keyboardType="email-address"
                value={correo}
                onChangeText={setCorreo}
            />
            <Campo
                icono="lock-closed-outline"
                placeholder="Contraseña (mínimo 10 caracteres)"
                clave
                autoCapitalize="none"
                value={clave}
                onChangeText={setClave}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={{ height: 8 }} />
            <Boton texto="Registrarse" onPress={registrarse} cargando={enviando} />

            <Pressable style={styles.pie} onPress={() => router.replace('/')}>
                <Text style={styles.pieTexto}>
                    ¿Ya tienes cuenta? <Text style={styles.pieEnlace}>Inicia sesión</Text>
                </Text>
            </Pressable>
        </PantallaAuth>
    );
}

const styles = StyleSheet.create({
    logoCaja: {
        alignItems: 'center',
        marginBottom: 20,
    },
    titulo: {
        fontSize: 28,
        color: colores.texto,
        fontWeight: '800',
        letterSpacing: -0.7,
        textAlign: 'center',
    },
    subtitulo: {
        fontSize: 15,
        color: colores.texto2,
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 28,
        lineHeight: 21,
    },
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginTop: 4,
    },
    pie: {
        marginTop: 22,
        alignItems: 'center',
    },
    pieTexto: {
        color: colores.texto2,
        fontSize: 14,
    },
    pieEnlace: {
        color: colores.acento,
        fontWeight: '700',
    },
    iconoLlave: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 20,
    },
    cajaClave: {
        backgroundColor: colores.tarjeta,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
    },
    clave: {
        color: colores.texto,
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 24,
    },
    compartir: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 22,
    },
    compartirTexto: {
        color: colores.acento,
        fontWeight: '700',
        fontSize: 14,
    },
});