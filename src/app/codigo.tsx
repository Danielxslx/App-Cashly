import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { API } from '../config';
import { guardarRefresh, guardarToken, obtenerMfaLogin } from '../sesion';
import { colores } from '../tema';
import { Boton, PantallaAuth } from '../ui';

export default function Codigo() {
    const router = useRouter();
    const [codigo, setCodigo] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    const verificar = async () => {
        setError('');
        if (codigo.replace(/\s/g, '').length !== 6) {
            setError('El código debe tener 6 dígitos');
            return;
        }
        setEnviando(true);
        try {
            const respuesta = await fetch(`${API}/auth/login/mfa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mfaToken: obtenerMfaLogin(), code: codigo }),
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

    return (
        <PantallaAuth>
            <View style={styles.icono}>
                <Ionicons name="shield-checkmark-outline" size={34} color={colores.acento} />
            </View>
            <Text style={styles.titulo}>Verificación en dos pasos</Text>
            <Text style={styles.subtitulo}>
                Escribe el código de 6 dígitos de tu app Authenticator
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

            <View style={{ height: 8 }} />
            <Boton texto="Verificar" onPress={verificar} cargando={enviando} />

            <Pressable style={styles.volver} onPress={() => router.replace('/')}>
                <Text style={styles.volverTexto}>Volver al login</Text>
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
    volver: {
        alignItems: 'center',
        marginTop: 22,
    },
    volverTexto: {
        color: colores.acento,
        fontWeight: '700',
        fontSize: 14.5,
    },
});