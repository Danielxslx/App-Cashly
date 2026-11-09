import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { API } from '../config';
import { guardarRefresh, guardarToken, obtenerMfaLogin } from '../sesion';
import { colores } from '../tema';

export default function Codigo() {
    const router = useRouter();
    const [codigo, setCodigo] = useState('');
    const [error, setError] = useState('');

    const verificar = async () => {
        if (codigo.replace(/\s/g, '').length !== 6) {
            setError('El código debe tener 6 dígitos');
            return;
        }
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
        }
    };

    return (
        <View style={styles.contenedor}>
            <Text style={styles.titulo}>Verificación en dos pasos</Text>
            <Text style={styles.texto}>
                Escribe el código de 6 dígitos de tu app Authenticator
            </Text>
            <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colores.placeholder}
                keyboardType="numeric"
                maxLength={7}
                value={codigo}
                onChangeText={setCodigo}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable style={styles.boton} onPress={verificar}>
                <Text style={styles.textoBoton}>Verificar</Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/')}>
                <Text style={styles.enlace}>Volver al login</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        padding: 24,
        paddingTop: 200,
        backgroundColor: colores.fondo,
    },
    titulo: {
        fontSize: 28,
        color: colores.texto,
        textAlign: 'center',
        marginBottom: 12,
    },
    texto: {
        fontSize: 15,
        color: colores.texto2,
        textAlign: 'center',
        marginBottom: 32,
    },
    input: {
        backgroundColor: colores.tarjeta,
        color: colores.texto,
        padding: 14,
        borderWidth: 1,
        borderColor: colores.bordes,
        borderRadius: 10,
        marginBottom: 14,
        textAlign: 'center',
        fontSize: 24,
    },
    boton: {
        backgroundColor: colores.acento,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    textoBoton: {
        color: colores.texto,
        fontSize: 16,
        fontWeight: 'bold',
    },
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginBottom: 8,
    },
    enlace: {
        color: colores.acento2,
        textAlign: 'center',
        marginTop: 20,
    },
});