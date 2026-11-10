import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { API } from '../config';
import { colores } from '../tema';
import { Boton, PantallaAuth } from '../ui';

export default function Verificar() {
    const router = useRouter();
    const { correo } = useLocalSearchParams<{ correo: string }>();
    const [codigo, setCodigo] = useState('');
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [segundos, setSegundos] = useState(0);

    // cuenta regresiva para poder reenviar el código
    useEffect(() => {
        if (segundos <= 0) return;
        const t = setTimeout(() => setSegundos(segundos - 1), 1000);
        return () => clearTimeout(t);
    }, [segundos]);

    const leer = async (respuesta: Response) => {
        const texto = await respuesta.text();
        try {
            return JSON.parse(texto);
        } catch {
            return {};
        }
    };

    const verificar = async () => {
        setError('');
        setAviso('');
        const limpio = codigo.replace(/\s/g, '');
        if (limpio.length !== 6) {
            setError('El código debe tener 6 dígitos');
            return;
        }
        setEnviando(true);
        try {
            const respuesta = await fetch(`${API}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: correo, code: limpio }),
            });
            const datos = await leer(respuesta);
            if (respuesta.ok) {
                router.replace('/');
                return;
            }
            let mensaje = datos.error ?? 'No se pudo verificar el correo';
            if (typeof datos.attemptsLeft === 'number') {
                mensaje += ` (te quedan ${datos.attemptsLeft} intentos)`;
            }
            setError(mensaje);
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setEnviando(false);
        }
    };

    const reenviar = async () => {
        setError('');
        setAviso('');
        try {
            const respuesta = await fetch(`${API}/auth/resend-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: correo }),
            });
            const datos = await leer(respuesta);
            if (respuesta.ok) {
                setAviso('Te enviamos un código nuevo');
                setSegundos(60);
            } else if (respuesta.status === 429) {
                setSegundos(datos.retryAfterSec ?? 60);
                setError('Espera un momento antes de pedir otro código');
            } else {
                setError(datos.error ?? 'No se pudo reenviar el código');
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        }
    };

    return (
        <PantallaAuth>
            <View style={styles.icono}>
                <Ionicons name="mail-open-outline" size={34} color={colores.acento} />
            </View>
            <Text style={styles.titulo}>Revisa tu correo</Text>
            <Text style={styles.subtitulo}>
                Enviamos un código de 6 dígitos a{'\n'}
                <Text style={styles.correo}>{correo}</Text>
            </Text>

            <TextInput
                style={styles.codigo}
                placeholder="000000"
                placeholderTextColor="#C5CAD6"
                keyboardType="number-pad"
                maxLength={7}
                value={codigo}
                onChangeText={setCodigo}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

            <View style={{ height: 8 }} />
            <Boton texto="Verificar" onPress={verificar} cargando={enviando} />

            <Pressable style={styles.reenviar} onPress={reenviar} disabled={segundos > 0}>
                <Text style={[styles.reenviarTexto, segundos > 0 && { color: colores.placeholder }]}>
                    {segundos > 0 ? `Reenviar código en ${segundos} s` : 'Reenviar código'}
                </Text>
            </Pressable>

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
    correo: {
        color: colores.texto,
        fontWeight: '700',
    },
    codigo: {
        backgroundColor: colores.tarjeta,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        borderRadius: 16,
        paddingVertical: 16,
        textAlign: 'center',
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: 8,
        color: colores.texto,
        marginBottom: 12,
    },
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginTop: 4,
    },
    aviso: {
        color: colores.ok,
        textAlign: 'center',
        marginTop: 4,
        fontWeight: '600',
    },
    reenviar: {
        alignItems: 'center',
        marginTop: 22,
    },
    reenviarTexto: {
        color: colores.acento,
        fontWeight: '700',
        fontSize: 14.5,
    },
    volver: {
        alignItems: 'center',
        marginTop: 16,
    },
    volverTexto: {
        color: colores.texto2,
        fontWeight: '600',
        fontSize: 14,
    },
});