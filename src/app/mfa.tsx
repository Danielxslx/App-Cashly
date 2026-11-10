import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { API } from '../config';
import { guardarRefresh, guardarToken, obtenerMfa } from '../sesion';
import { colores } from '../tema';
import { Boton, PantallaAuth } from '../ui';

export default function Mfa() {
    const router = useRouter();
    const mfa = obtenerMfa();
    const [codigo, setCodigo] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    const confirmar = async () => {
        if (!mfa) return;
        setError('');
        if (codigo.replace(/\s/g, '').length !== 6) {
            setError('El código debe tener 6 dígitos');
            return;
        }
        setEnviando(true);
        try {
            const respuesta = await fetch(`${API}/auth/mfa/setup/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mfaToken: mfa.mfaToken, code: codigo }),
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
                guardarToken(datos.accessToken);
                guardarRefresh(datos.refreshToken);
                router.replace('/gastos');
            } else {
                setError(datos.error);
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setEnviando(false);
        }
    };

    if (!mfa) {
        return (
            <PantallaAuth>
                <Text style={styles.titulo}>No hay un registro pendiente</Text>
                <View style={{ height: 24 }} />
                <Boton texto="Ir al login" onPress={() => router.replace('/')} />
            </PantallaAuth>
        );
    }

    return (
        <PantallaAuth>
            <View style={styles.icono}>
                <Ionicons name="shield-checkmark-outline" size={34} color={colores.acento} />
            </View>
            <Text style={styles.titulo}>Verificación en dos pasos</Text>
            <Text style={styles.subtitulo}>
                Agrega tu cuenta en Microsoft Authenticator y escribe el código de 6 dígitos que te
                muestra.
            </Text>

            <Boton texto="Abrir Authenticator" onPress={() => Linking.openURL(mfa.otpauthUrl)} />

            <Text style={styles.ayuda}>Si no abre, agrégala a mano con esta clave:</Text>
            <View style={styles.cajaClave}>
                <Text selectable style={styles.clave}>
                    {mfa.secret}
                </Text>
            </View>

            <View style={styles.qrCaja}>
                <Image source={{ uri: mfa.qrCode }} style={styles.qr} />
            </View>

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
            <View style={{ height: 8 }} />
            <Boton texto="Confirmar" onPress={confirmar} cargando={enviando} />
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
        fontSize: 26,
        color: colores.texto,
        fontWeight: '800',
        letterSpacing: -0.6,
        textAlign: 'center',
    },
    subtitulo: {
        fontSize: 15,
        color: colores.texto2,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
        lineHeight: 22,
    },
    ayuda: {
        fontSize: 13.5,
        color: colores.texto2,
        textAlign: 'center',
        marginTop: 22,
        marginBottom: 10,
    },
    cajaClave: {
        backgroundColor: colores.tarjeta,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        borderRadius: 14,
        padding: 14,
    },
    clave: {
        color: colores.texto,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 1,
    },
    qrCaja: {
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        marginVertical: 22,
        borderWidth: 1,
        borderColor: colores.bordes,
    },
    qr: {
        width: 200,
        height: 200,
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
});