import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { API } from '../config';
import {
  cargarRefreshGuardado,
  guardarCorreoActual,
  guardarMfa,
  guardarMfaLogin,
  guardarRefresh,
  guardarToken,
} from '../sesion';
import { colores } from '../tema';
import { Boton, Campo, Logo, NotaSeguridad, PantallaAuth, Separador } from '../ui';

export default function Login() {
    const [correo, setCorreo] = useState('');
    const [clave, setClave] = useState('');
    const router = useRouter();
    const [error, setError] = useState('');
    const [revisando, setRevisando] = useState(true);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        const restaurar = async () => {
            try {
                const guardado = await cargarRefreshGuardado();
                if (!guardado) {
                    return;
                }
                const respuesta = await fetch(`${API}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: guardado }),
                });
                if (respuesta.ok) {
                    const datos = await respuesta.json();
                    guardarToken(datos.accessToken);
                    guardarRefresh(datos.refreshToken);
                    router.replace('/(tabs)/gastos');
                    return;
                }
            } catch {
                // si falla, se muestra el login normal
            } finally {
                setRevisando(false);
            }
        };
        restaurar();
    }, []);

    const iniciarSesion = async () => {
        setError('');
        setEnviando(true);
        try {
            const respuesta = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: correo, password: clave }),
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
            if (respuesta.status === 403 && datos.emailVerificationRequired) {
                router.replace({ pathname: '/verificar', params: { correo } });
                return;
            }
            if (!respuesta.ok) {
                setError(datos.error);
                return;
            }
            guardarCorreoActual(correo);
            if (datos.mfaRequired) {
                guardarMfaLogin(datos.mfaToken);
                router.replace('/codigo');
            } else if (datos.mfaSetupRequired) {
                guardarMfa({ mfaToken: datos.mfaToken, ...datos.mfaSetup });
                router.replace('/mfa');
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setEnviando(false);
        }
    };

    if (revisando) {
        return (
            <View style={styles.cargando}>
                <Logo tam={84} />
                <ActivityIndicator color={colores.acento} style={{ marginTop: 28 }} />
            </View>
        );
    }

    return (
        <PantallaAuth>
            <View style={styles.logoCaja}>
                <Logo />
            </View>
            <Text style={styles.titulo}>Bienvenido a Cashly</Text>
            <Text style={styles.subtitulo}>Ordena tus finanzas sin complicarte</Text>

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
                placeholder="Contraseña"
                clave
                autoCapitalize="none"
                value={clave}
                onChangeText={setClave}
            />

            <Pressable style={styles.olvido} onPress={() => router.push('/recuperar')}>
                <Text style={styles.olvidoTexto}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Boton texto="Iniciar sesión" onPress={iniciarSesion} cargando={enviando} />

            <Separador />

            <Boton tipo="secundario" texto="Crear una cuenta" onPress={() => router.push('/registro')} />

            <NotaSeguridad />
        </PantallaAuth>
    );
}

const styles = StyleSheet.create({
    cargando: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colores.fondo,
    },
    logoCaja: {
        alignItems: 'center',
        marginBottom: 22,
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
        marginBottom: 30,
    },
    olvido: {
        alignSelf: 'flex-end',
        marginTop: 2,
        marginBottom: 20,
    },
    olvidoTexto: {
        color: colores.acento,
        fontWeight: '700',
        fontSize: 13.5,
    },
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginBottom: 14,
    },
});  