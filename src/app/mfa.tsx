import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { API } from '../config';
import { guardarRefresh, guardarToken, obtenerMfa, } from '../sesion';
import { colores } from '../tema';

export default function Mfa() {
    const router = useRouter();
    const mfa = obtenerMfa();
    const [codigo, setCodigo] = useState('');
    const [error, setError] = useState('');

    const confirmar = async () => {
        if (!mfa) return;
        if (codigo.replace(/\s/g, '').length !== 6) {
            setError('El código debe tener 6 dígitos');
            return;
        }
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
        }
    };

    if (!mfa) {
        return (
            <View style={styles.contenedor}>
                <Text style={styles.titulo}>No hay un registro pendiente</Text>
                <Pressable style={styles.boton} onPress={() => router.replace('/')}>
                    <Text style={styles.textoBoton}>Ir al login</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView style={styles.pantalla} contentContainerStyle={styles.contenedor}>
            <Text style={styles.titulo}>Verificación en dos pasos</Text>
            <Text style={styles.texto}>
                Agrega tu cuenta en Microsoft Authenticator y escribe el código de 6 dígitos que te muestra.
            </Text>

            <Pressable style={styles.boton} onPress={() => Linking.openURL(mfa.otpauthUrl)}>
                <Text style={styles.textoBoton}>Abrir Authenticator</Text>
            </Pressable>

            <Text style={styles.texto}>Si no abre, agrégala a mano con esta clave:</Text>
            <Text selectable style={styles.clave}>{mfa.secret}</Text>

            <Image source={{ uri: mfa.qrCode }} style={styles.qr} />

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
            <Pressable style={styles.boton} onPress={confirmar}>
                <Text style={styles.textoBoton}>Confirmar</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    pantalla: {
        flex: 1,
        backgroundColor: colores.fondo,
    },
    contenedor: {
        padding: 24,
        paddingTop: 80,
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
        marginBottom: 16,
    },
    clave: {
        color: colores.texto,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
    },
    qr: {
        width: 200,
        height: 200,
        alignSelf: 'center',
        marginVertical: 20,
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
        marginBottom: 16,
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
});