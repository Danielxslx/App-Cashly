import { Ionicons } from '@expo/vector-icons';
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
        texto: 'En Perfil, dentro de «Captura automática», toca «Generar token para el Atajo».',
    },
    {
        titulo: 'Copia tu token',
        texto: 'Aparece una ventana «Tu token del Atajo». Toca «Copiar o compartir» (o mantén presionado el token) y cópialo. Empieza por it_',
        aviso: 'Solo se muestra una vez. Si lo pierdes, toca la papelera junto al token en Perfil y genera uno nuevo.',
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
        titulo: 'Abre el cuerpo',
        texto: 'Baja un poco y toca «Cuerpo de la solicitud». Elige «JSON». Ahí vas a añadir 3 campos, uno por uno.',
    },
    {
        titulo: 'Añade el primer campo',
        texto: 'Toca «Añadir nuevo campo» y elige «Texto». A la izquierda escribe el nombre del campo. A la derecha toca el valor y elige la variable «Entrada del atajo»; luego elige «Comercio».',
        datos: [
            { etiqueta: 'Nombre (izquierda)', valor: 'merchant' },
            { etiqueta: 'Valor (derecha)', valor: 'Entrada del atajo → Comercio' },
        ],
        aviso: 'El nombre debe quedar exactamente así: en minúsculas y sin espacios.',
    },
    {
        titulo: 'Repite con los otros dos',
        texto: 'Añade dos campos más del mismo modo: «Añadir nuevo campo», «Texto», el nombre a la izquierda y la variable a la derecha.',
        datos: [
            { etiqueta: 'amount', valor: 'Entrada del atajo → Importe' },
            { etiqueta: 'card', valor: 'Entrada del atajo → Tarjeta' },
        ],
        aviso: 'No necesitas poner la fecha: Cashly usa la hora del pago.',
    },
    {
        titulo: 'Que corra solo',
        texto: 'Toca «Siguiente», elige «Ejecutar inmediatamente» (no «Preguntar antes de ejecutar») y toca «Listo».',
    },
    {
        titulo: '¡Pruébalo!',
        texto: 'Paga con Apple Pay en un comercio. Vuelve a Cashly y desliza hacia abajo para actualizar: tu gasto aparece solo.',
        aviso: 'Para comprobarlo, mira en Perfil: tu token dirá «usado» con la fecha en lugar de «sin usar». El gasto llega sin categoría; tócalo para editarla.',
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

            <View style={s.progreso}>
                {PASOS.map((_, n) => (
                    <View key={n} style={[s.segmento, n <= i && s.segmentoListo]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={s.contenido}>
                <Text style={s.numero}>Paso {i + 1} de {PASOS.length}</Text>
                <Text style={s.titulo}>{paso.titulo}</Text>
                <Text style={s.texto}>{paso.texto}</Text>

                {paso.datos ? (
                    <View style={s.datos}>
                        {paso.datos.map((d) => (
                            <View key={d.etiqueta} style={s.dato}>
                                <Text style={s.datoEtiqueta}>{d.etiqueta}</Text>
                                <Text selectable style={s.datoValor}>{d.valor}</Text>
                            </View>
                        ))}
                        <Text style={s.copiar}>Mantén pulsado un valor para copiarlo</Text>
                    </View>
                ) : null}

                {paso.aviso ? (
                    <View style={s.avisoCaja}>
                        <Ionicons name="information-circle-outline" size={20} color={colores.acento} />
                        <Text style={s.avisoTexto}>{paso.aviso}</Text>
                    </View>
                ) : null}
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
    contenido: { padding: 24, paddingTop: 20 },
    numero: { color: colores.acento, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    titulo: { color: colores.texto, fontSize: 28, fontWeight: '800', marginTop: 6, marginBottom: 16 },
    texto: { color: colores.texto, fontSize: 18, lineHeight: 27, fontWeight: '500' },
    pie: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 34 },

    progreso: { flexDirection: 'row', gap: 5, paddingHorizontal: 24, paddingTop: 64 },
    segmento: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colores.bordes },
    segmentoListo: { backgroundColor: colores.acento },
    datos: {
        marginTop: 18,
        backgroundColor: colores.tarjeta,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        borderRadius: 16,
        padding: 14,
        gap: 12,
    },
    dato: { gap: 2 },
    datoEtiqueta: { color: colores.texto2, fontSize: 12, fontWeight: '700' },
    datoValor: { color: colores.texto, fontSize: 15, fontWeight: '700' },
    copiar: { color: colores.placeholder, fontSize: 12 },
    avisoCaja: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        backgroundColor: colores.tarjeta,
    },
    avisoTexto: { flex: 1, color: colores.texto2, fontSize: 14, lineHeight: 20, fontWeight: '600' },
});