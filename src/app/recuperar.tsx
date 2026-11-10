import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { API } from '../config';
import { guardarMfa } from '../sesion';
import { colores } from '../tema';

export default function Recuperar() {
  const [correo, setCorreo] = useState('');
  const [llave, setLlave] = useState('');
  const [clave, setClave] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const recuperar = async () => {
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) {
      setError('Escribe un correo válido');
      return;
    }
    if (llave.trim() === '') {
      setError('Escribe tu clave de recuperación');
      return;
    }
    if (clave.length < 10) {
      setError('La contraseña nueva debe tener mínimo 10 caracteres');
      return;
    }
    setError('');
    try {
      const respuesta = await fetch(`${API}/auth/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: correo.trim(),
          recoveryKey: llave.trim(),
          newPassword: clave,
        }),
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
        guardarMfa({ mfaToken: datos.mfaToken, ...datos.mfaSetup });
        setClaveNueva(datos.recoveryKey);
      } else {
        setError(datos.error ?? 'No se pudo recuperar la cuenta');
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    }
  };

  if (claveNueva) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Guarda tu nueva clave</Text>
        <Text style={styles.texto}>
          Tu clave anterior ya no sirve. Esta se muestra una sola vez. Además, tu Authenticator
          anterior dejó de funcionar: en el siguiente paso escanearás un QR nuevo.
        </Text>
        <Text selectable style={styles.clave}>{claveNueva}</Text>
        <Pressable style={styles.boton} onPress={() => router.replace('/mfa')}>
          <Text style={styles.textoBoton}>Ya la guardé</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={styles.contenedor}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Recuperar cuenta</Text>
      <Text style={styles.texto}>
        Usa la clave de recuperación que guardaste cuando te registraste.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor={colores.placeholder}
        autoCapitalize="none"
        keyboardType="email-address"
        value={correo}
        onChangeText={setCorreo}
      />
      <TextInput
        style={styles.input}
        placeholder="Clave de recuperación"
        placeholderTextColor={colores.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        value={llave}
        onChangeText={setLlave}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña nueva (mín. 10 caracteres)"
        placeholderTextColor={colores.placeholder}
        secureTextEntry
        value={clave}
        onChangeText={setClave}
      />
      <Pressable style={styles.boton} onPress={recuperar}>
        <Text style={styles.textoBoton}>Recuperar cuenta</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={() => router.replace('/')}>
        <Text style={styles.enlace}>Volver a iniciar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 24,
    paddingTop: 140,
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
  clave: {
    color: colores.texto,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
});