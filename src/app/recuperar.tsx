import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { API } from '../config';
import { guardarCorreoActual, guardarMfa } from '../sesion';
import { colores } from '../tema';
import { Boton, Campo, PantallaAuth } from '../ui';

export default function Recuperar() {
    const router = useRouter();
    const [correo, setCorreo] = useState('');
    const [llave, setLlave] = useState('');
    const [nueva, setNueva] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [claveNueva, setClaveNueva] = useState('');

    const recuperar = async () => {
        setError('');
        if (!/^\S+@\S+\.\S+$/.test(correo)) {
            setError('Escribe un correo válido');
            return;
        }
        if (llave.trim() === '') {
            setError('Escribe tu clave de recuperación');
            return;
        }
        if (nueva.length < 10) {
            setError('La contraseña nueva debe tener mínimo 10 caracteres');
            return;
        }
        setEnviando(true);
        try {
            const respuesta = await fetch(`${API}/auth/recover`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: correo,
                    recoveryKey: llave.trim(),
                    newPassword: nueva,
                }),
            });
            const texto = await respuesta.text();
            let datos: any = {};
            try {
                datos = JSON.parse(texto);
            } catch {
                setError(
                    respuesta.status === 429
                        ? 'Demasiados intentos, espera unos minutos'
                        : 'El servidor respondió algo inesperado'
                );
                return;
            }
            if (!respuesta.ok) {
                setError(datos.error ?? 'No se pudo recuperar la cuenta');
                return;
            }
            guardarCorreoActual(correo);
            guardarMfa({ mfaToken: datos.mfaToken, ...datos.mfaSetup });
            setClaveNueva(datos.recoveryKey);
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setEnviando(false);
        }
    };

    const compartirClave = () => {
        Share.share({ message: `Mi nueva clave de recuperación de Cashly: ${claveNueva}` });
    };

    if (claveNueva) {
        return (
            <PantallaAuth>
                <View style={styles.iconoLlave}>
                    <Ionicons name="key-outline" size={34} color="#B45309" />
                </View>
                <Text style={styles.titulo}>Esta es tu nueva clave</Text>
                <Text style={styles.subtitulo}>
                    Guárdala: la anterior ya no sirve y solo se muestra una vez. En el siguiente paso
                    vas a configurar de nuevo tu Authenticator.
                </Text>
                <View style={styles.cajaClave}>
                    <Text selectable style={styles.clave}>
                        {claveNueva}
                    </Text>
                </View>
                <Pressable style={styles.compartir} onPress={compartirClave}>
                    <Ionicons name="share-outline" size={18} color={colores.acento} />
                    <Text style={styles.compartirTexto}>Guardar o compartir</Text>
                </Pressable>
                <Boton texto="Continuar" onPress={() => router.replace('/mfa')} />
            </PantallaAuth>
        );
    }

    return (
        <PantallaAuth>
            <View style={styles.icono}>
                <Ionicons name="shield-checkmark-outline" size={34} color={colores.acento} />
            </View>
            <Text style={styles.titulo}>Recuperar cuenta</Text>
            <Text style={styles.subtitulo}>
                Usa la clave de recuperación que guardaste cuando te registraste.
            </Text>

            <Campo
                icono="mail-outline"
                placeholder="Correo electrónico"
                autoCapitalize="none"
                keyboardType="email-address"
                value={correo}
                onChangeText={setCorreo}
            />
            <Campo
                icono="key-outline"
                placeholder="Clave de recuperación"
                autoCapitalize="none"
                autoCorrect={false}
                value={llave}
                onChangeText={setLlave}
            />
            <Campo
                icono="lock-closed-outline"
                placeholder="Contraseña nueva (mínimo 10 caracteres)"
                clave
                autoCapitalize="none"
                value={nueva}
                onChangeText={setNueva}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={{ height: 8 }} />
            <Boton texto="Recuperar cuenta" onPress={recuperar} cargando={enviando} />

            <Pressable style={styles.volver} onPress={() => router.replace('/')}>
                <Text style={styles.volverTexto}>Volver a iniciar sesión</Text>
            </Pressable>
        </PantallaAuth>
    );
}

const styles = StyleSheet.create({
    icono: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#E8ECFF',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 20,
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
        marginTop: 8,
        marginBottom: 28,
        lineHeight: 22,
    },
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginTop: 4,
    },
    volver: {
        alignItems: 'center',
        marginTop: 22,
    },
    volverTexto: {
        color: colores.acento,
        fontWeight: '700',
        fontSize: 14.5,
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