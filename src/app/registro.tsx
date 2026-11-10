import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { API } from '../config';
import { guardarNombre } from '../sesion';
import { colores } from '../tema';

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const router = useRouter();
  const [claveRecuperacion, setClaveRecuperacion] = useState('');
  const [error, setError] = useState('');

  const registrarse = async () => {
    try {
      if (!/^\S+@\S+\.\S+$/.test(correo)) {
        setError('Escribe un correo válido');
        return;
      }
      if (clave.length < 10) {
        setError('La contraseña debe tener mínimo 10 caracteres');
        return;
      }
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
    }
  };
  if (claveRecuperacion) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>guarda tu clave de recuperacion</Text>
        <Text style={styles.texto}> Solo se muestra una vez. Si olvidas tu contraseña , es lo unico que te permite recuperar tu cuenta </Text>
        <Text selectable style={styles.clave}>{claveRecuperacion}</Text>
        <Pressable
          style={styles.boton}
          onPress={() => router.replace({ pathname: '/verificar', params: { correo } })}
        >
          <Text style={styles.textoBoton}>Ya lo guarde</Text>
        </Pressable>
      </View>
    )
  }
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Crear Cuenta</Text>
      <Text style={styles.texto}>registrate para poder vivir la experiencia completa</Text>
      <TextInput style={styles.input}
        placeholder="Nombre de Usuario"
        placeholderTextColor={colores.placeholder}
        value={nombre}
        onChangeText={setNombre}
      />
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
      <Pressable style={styles.boton}
        onPress={registrarse}>
        <Text style={styles.textoBoton}>Registrarse</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Link href="/" style={styles.enlace}>¿Ya tienes cuenta?Inicia Sesion</Link>
    </View>
  )
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
    marginBottom: 50,
  },
  input: {
    backgroundColor: colores.tarjeta,
    color: colores.placeholder,
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
    color: colores.placeholder,
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
  clave: {
    color: colores.texto,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
}); 