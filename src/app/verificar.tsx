import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { API } from '../config';
import { colores } from '../tema';

export default function Verificar() {
  const { correo } = useLocalSearchParams<{ correo: string }>();
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [verificado, setVerificado] = useState(false);

  const llamar = async (ruta: string, cuerpo: object) => {
    const respuesta = await fetch(`${API}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    const texto = await respuesta.text();
    let datos: any = {};
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = { error: 'El servidor respondió algo inesperado' };
    }
    return { ok: respuesta.ok, datos };
  };

  const verificar = async () => {
    const limpio = codigo.replace(/\s/g, '');
    if (!/^\d{6}$/.test(limpio)) {
      setError('El código tiene 6 dígitos');
      return;
    }
    setError('');
    setAviso('');
    try {
      const { ok, datos } = await llamar('/auth/verify-email', { email: correo, code: limpio });
      if (ok) {
        setVerificado(true);
      } else {
        const restantes =
          datos.attemptsLeft !== undefined ? ` (te quedan ${datos.attemptsLeft} intentos)` : '';
        setError((datos.error ?? 'No se pudo verificar') + restantes);
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    }
  };

  const reenviar = async () => {
    setError('');
    setAviso('');
    try {
      const { ok, datos } = await llamar('/auth/resend-code', { email: correo });
      if (ok) {
        setAviso('Te enviamos un código nuevo');
      } else {
        setError(datos.error ?? 'No se pudo reenviar el código');
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    }
  };

  if (verificado) {
    return (
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Correo verificado ✅</Text>
        <Text style={styles.texto}>
          Ahora inicia sesión para activar tu Authenticator.
        </Text>
        <Pressable style={styles.boton} onPress={() => router.replace('/')}>
          <Text style={styles.textoBoton}>Ir a iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Verifica tu correo</Text>
      <Text style={styles.texto}>
        Enviamos un código de 6 dígitos a {correo}. Vence en 10 minutos.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Código de 6 dígitos"
        placeholderTextColor={colores.placeholder}
        keyboardType="number-pad"
        maxLength={7}
        value={codigo}
        onChangeText={setCodigo}
      />
      <Pressable style={styles.boton} onPress={verificar}>
        <Text style={styles.textoBoton}>Verificar</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
      <Pressable onPress={reenviar}>
        <Text style={styles.enlace}>¿No te llegó? Reenviar código</Text>
      </Pressable>
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
    textAlign: 'center',
    fontSize: 20,
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
  aviso: {
    color: '#22C55E',
    textAlign: 'center',
    marginTop: 12,
  },
});