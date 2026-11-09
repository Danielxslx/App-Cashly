import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { API } from '../config';
import {
  cargarRefreshGuardado,
  guardarMfa,
  guardarMfaLogin,
  guardarRefresh,
  guardarToken,
} from '../sesion';
import { colores } from '../tema';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const router = useRouter();
  const [error, setError] = useState('');
  const [revisando,setRevisando] = useState(true);

  useEffect (() => {
    const restaurar = async ()  => {
      try {
        const guardado = await cargarRefreshGuardado();
        if (!guardado){
          return;
        }
      
      const respuesta = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({refreshToken: guardado }),
      });
      if(respuesta.ok) {
        const datos = await respuesta.json();
        guardarToken(datos.accessToken);
        guardarRefresh(datos.refreshToken);
        router.replace('/(tabs)/gastos');
        return;
      }
    } catch{

    } finally{
      setRevisando(false);
    }
  };
  restaurar();
  },[]);

  const iniciarSesion = async () => {
    setError('');
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
      if (!respuesta.ok) {
        setError(datos.error);
        return;
      }
      if (datos.mfaRequired) {
        guardarMfaLogin(datos.mfaToken);
        router.replace('/codigo');
      } else if (datos.mfaSetupRequired) {
        guardarMfa({ mfaToken: datos.mfaToken, ...datos.mfaSetup });
        router.replace('/mfa');
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    }
  };
  if (revisando) {
    return (
    <View style={[styles.contenedor, {justifyContent: 'center', paddingTop: 0}]}>
      <ActivityIndicator color={colores.acento2} />
    </View>
    );
  }
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Bienvenido a JDS</Text>
      <Text style={styles.texto}>haz que tus finanzas sean mucho mas sencillas</Text>
      <TextInput style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor={colores.placeholder}
        autoCapitalize="none"
        keyboardType="email-address"
        value={correo}
        onChangeText={setCorreo}
      />
      <TextInput style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={colores.placeholder}
        value={clave}
        onChangeText={setClave}
        secureTextEntry
      />
      <Pressable style={styles.boton} onPress={iniciarSesion}>
        <Text style={styles.textoBoton}>Iniciar Sesion</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Link href="/registro" style={styles.enlace}>¿No tienes cuenta? Registrate</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 24,
    paddingTop: 300,
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontSize: 30,
    color: colores.texto,
    textAlign: 'center',
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
  enlace: {
    color: colores.acento2,
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: colores.gasto,
    textAlign: 'center',
    marginTop: 12,
  },
});