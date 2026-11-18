import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colores } from '../tema';
import { Boton } from '../ui';

type Dato = { etiqueta: string; valor: string };
type Paso = { titulo: string; texto: string; datos?: Dato[]; aviso?: string };

const PASOS: Paso[] = [
    {
        titulo: 'Genera tu token',
        texto: 'En Perfil, toca el botón para generar un token de captura y ponle un nombre que reconozcas, por ejemplo «Mi iPhone».',
    },
    {
        titulo: 'Copia tu token',
        texto: 'El token aparece una sola vez. Mantén el dedo sobre él y elige «Copiar». Empieza por it_',
        aviso: 'Si lo pierdes, revoca ese token en Perfil y genera uno nuevo.',
    },
    {
        titulo: 'Abre la app Atajos',
        texto: 'Sal de Cashly y abre la app Atajos, que ya viene en tu iPhone. Abajo toca «Automatización».',
    },
    {
        titulo: 'Crea una automatización',
        texto: 'Toca el + de arriba y elige «Crear automatización personal».',
    },
    {
        titulo: 'Elige «Transacción»',
        texto: 'Busca «Transacción»: se activa cada vez que pagas con Apple Pay. Marca las tarjetas que quieras y toca «Siguiente».',
    },
    {
        titulo: 'Añade la acción',
        texto: 'Toca «Añadir acción», escribe «Obtener contenido de URL» y tócala.',
    },
    {
        titulo: 'Dirección y método',
        texto: 'Pega esta dirección en el campo URL. Luego toca «GET» y cámbialo por «POST».',
        datos: [
            { etiqueta: 'URL', valor: 'https://api.cashly.lat/v1/ingest' },
            { etiqueta: 'Método', valor: 'POST' },
        ],
    },
    {
        titulo: 'Agrega los encabezados',
        texto: 'Toca «Encabezados» y añade dos. En el primero escribe la palabra Bearer, un espacio y pega tu token.',
        datos: [
            { etiqueta: 'Authorization', valor: 'Bearer (tu token)' },
            { etiqueta: 'Content-Type', valor: 'application/json' },
        ],
        aviso: 'El error más común es olvidar la palabra Bearer o el espacio después.',
    },
    {
        titulo: 'Agrega el cuerpo',
        texto: 'Toca «Cuerpo de la solicitud», elige JSON y añade 4 campos de tipo Texto. En cada valor elige la variable de «Entrada del atajo».',
        datos: [
            { etiqueta: 'merchant', valor: 'Comercio' },
            { etiqueta: 'amount', valor: 'Importe' },
            { etiqueta: 'card', valor: 'Tarjeta' },
            { etiqueta: 'date', valor: 'Fecha actual' },
        ],
    },
    {
        titulo: 'Que corra solo',
        texto: 'Toca «Siguiente», elige «Ejecutar inmediatamente» (no «Preguntar antes de ejecutar») y toca «Listo».',
    },
    {
        titulo: '¡Pruébalo!',
        texto: 'Paga con Apple Pay en un comercio. Vuelve a Cashly y desliza hacia abajo para actualizar: tu gasto aparece solo.',
        aviso: 'Por ahora el gasto llega sin categoría. Tócalo para editarla.',
    },
];

export default function GuiaAtajo() {
    const router = useRouter();
    const [i, setI] = useState(0);
    const paso = PASOS[i];
    const esUltimo = i === PASOS.length - 1;

    return (
        <View style={s.raiz}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={s.contenido}>
                <Text style={s.numero}>Paso {i + 1} de {PASOS.length}</Text>
                <Text style={s.titulo}>{paso.titulo}</Text>
                <Text style={s.texto}>{paso.texto}</Text>
            </ScrollView>

            <View style={s.pie}>
                {i > 0 ? (
                    <View style={{ flex: 1 }}>
                        <Boton texto="Anterior" tipo="secundario" onPress={() => setI(i - 1)} />
                    </View>
                ) : null}
                <View style={{ flex: 1 }}>
                    <Boton
                        texto={esUltimo ? 'Listo' : 'Siguiente'}
                        onPress={() => (esUltimo ? router.back() : setI(i + 1))}
                    />
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 24, paddingTop: 70 },
    numero: { color: colores.acento, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    titulo: { color: colores.texto, fontSize: 28, fontWeight: '800', marginTop: 6, marginBottom: 16 },
    texto: { color: colores.texto, fontSize: 18, lineHeight: 27, fontWeight: '500' },
    pie: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 34 },
});