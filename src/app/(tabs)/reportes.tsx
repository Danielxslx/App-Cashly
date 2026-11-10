import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { peticion } from '../../api';
import { categoriaDe, colores } from '../../tema';

const NOMBRES_DIA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const letraDia = (fecha: string) => {
    const [a, m, d] = fecha.split('-').map(Number);
    return NOMBRES_DIA[new Date(a, m - 1, d).getDay()];
};

const dinero = (n: number) => `$ ${Math.round(n).toLocaleString('es-CO')}`;

const textoCambio = (pct: number | null) => {
    if (pct === null) return 'Sin semana previa';
    if (pct > 0) return `▲ ${Math.abs(Math.round(pct))}%`;
    if (pct < 0) return `▼ ${Math.abs(Math.round(pct))}%`;
    return '= igual';
};

const colorCambio = (pct: number | null) => {
    if (pct === null || pct === 0) return colores.texto2;
    return pct > 0 ? colores.gasto : colores.ok;
};

export default function Reportes() {
    const [dias, setDias] = useState<any[]>([]);
    const [resumen, setResumen] = useState<any>(null);
    const [semanas, setSemanas] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<[string, number][]>([]);
    const [totalMes, setTotalMes] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState('');

    const cargar = async () => {
        try {
            const hoy = new Date();
            const desde = new Date();
            desde.setDate(hoy.getDate() - 6);
            const clave = (f: Date) =>
                `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
            const respuesta = await peticion(
                `/reports/daily?tz=America/Bogota&from=${clave(desde)}&to=${clave(hoy)}`
            );
            const datos = await respuesta.json();
            if (respuesta.ok) {
                setDias(datos.days);
                setResumen(datos.summary);
                setError('');
            } else {
                setError(datos.error ?? 'No se pudo cargar el reporte');
            }

            const respSemanas = await peticion('/reports/weekly?tz=America/Bogota&weeks=4');
            const datosSemanas = await respSemanas.json();
            if (respSemanas.ok) {
                setSemanas(datosSemanas.weeks);
            }

            const inicioMes = new Date();
            inicioMes.setDate(1);
            inicioMes.setHours(0, 0, 0, 0);
            const respResumen = await peticion(
                `/transactions/summary?from=${encodeURIComponent(inicioMes.toISOString())}`
            );
            const datosResumen = await respResumen.json();
            if (respResumen.ok) {
                setTotalMes(datosResumen.total);
                setCategorias(
                    Object.entries(datosResumen.by_category as Record<string, number>).sort(
                        (a, b) => b[1] - a[1]
                    )
                );
            }
        } catch {
            setError('No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
    };

    const refrescar = async () => {
        setRefrescando(true);
        await cargar();
        setRefrescando(false);
    };

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [])
    );

    const maximo = Math.max(...dias.map((d) => d.total), 1);
    const divisor = totalMes > 0 ? totalMes : 1;

    return (
        <View style={s.contenedor}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={refrescar}
                        tintColor={colores.acento}
                    />
                }
            >
                <View style={s.cabecera}>
                    <Text style={s.titulo}>Reportes</Text>
                    <Text style={s.subtitulo}>Tus últimos 7 días</Text>
                </View>

                {error ? <Text style={s.error}>{error}</Text> : null}

                {cargando ? (
                    <ActivityIndicator color={colores.acento} style={s.cargando} />
                ) : resumen ? (
                    <>
                        <View style={s.tarjeta}>
                            <Text style={s.seccion}>Gasto por día</Text>
                            <View style={s.grafico}>
                                {dias.map((d) => {
                                    const esMax = d.total > 0 && d.total === maximo;
                                    return (
                                        <View key={d.date} style={s.columna}>
                                            <Text style={[s.valorBarra, esMax && { color: colores.acento, fontWeight: '800' }]}>
                                                {d.total > 0 ? Math.round(d.total / 1000) + 'k' : ''}
                                            </Text>
                                            <View
                                                style={[
                                                    s.barra,
                                                    {
                                                        height: Math.max((d.total / maximo) * 120, 6),
                                                        backgroundColor: esMax ? colores.acento : '#D5DCFF',
                                                    },
                                                ]}
                                            />
                                            <Text style={[s.letra, esMax && { color: colores.texto, fontWeight: '800' }]}>
                                                {letraDia(d.date)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={s.fila2}>
                            <View style={s.mini}>
                                <View style={[s.miniIcono, { backgroundColor: '#E8ECFF' }]}>
                                    <Ionicons name="wallet-outline" size={18} color={colores.acento} />
                                </View>
                                <Text style={s.miniEtiqueta}>Total</Text>
                                <Text style={s.miniValor}>{dinero(resumen.total)}</Text>
                            </View>
                            <View style={s.mini}>
                                <View style={[s.miniIcono, { backgroundColor: '#E0F7FB' }]}>
                                    <Ionicons name="trending-up-outline" size={18} color="#0891B2" />
                                </View>
                                <Text style={s.miniEtiqueta}>Promedio diario</Text>
                                <Text style={s.miniValor}>{dinero(resumen.avg_per_day)}</Text>
                            </View>
                        </View>

                        <View style={s.tarjeta}>
                            <Text style={s.seccion}>Día que más gastaste</Text>
                            <Text style={s.textoGrande}>
                                {resumen.max_day.total > 0
                                    ? `${resumen.max_day.date} · ${dinero(resumen.max_day.total)}`
                                    : 'Sin gastos esta semana'}
                            </Text>
                            <Text style={s.detalle}>{resumen.zero_days} días sin gastar</Text>
                        </View>

                        <View style={s.tarjeta}>
                            <Text style={s.seccion}>Dónde más gastas</Text>
                            {resumen.top_merchants.length === 0 ? (
                                <Text style={s.detalle}>Aún no hay datos.</Text>
                            ) : (
                                resumen.top_merchants.map((c: any, i: number) => (
                                    <View
                                        key={c.merchant}
                                        style={[s.filaComercio, i > 0 && s.filaBorde]}
                                    >
                                        <View style={s.puesto}>
                                            <Text style={s.puestoTexto}>{i + 1}</Text>
                                        </View>
                                        <Text style={[s.comercio, { flex: 1 }]} numberOfLines={1}>
                                            {c.merchant}
                                        </Text>
                                        <Text style={s.monto}>{dinero(c.total)}</Text>
                                    </View>
                                ))
                            )}
                        </View>

                        <View style={s.tarjeta}>
                            <Text style={s.seccion}>Gasto por categoría (este mes)</Text>
                            {categorias.length === 0 ? (
                                <Text style={s.detalle}>Aún no hay gastos este mes.</Text>
                            ) : (
                                categorias.map(([cat, valor]) => {
                                    const info = categoriaDe(cat === 'sin_categoria' ? undefined : cat);
                                    const pct = (valor / divisor) * 100;
                                    return (
                                        <View key={cat} style={s.catFila}>
                                            <View style={s.catEncabezado}>
                                                <View style={[s.catIcono, { backgroundColor: info.fondo }]}>
                                                    <Ionicons name={info.icono as any} size={16} color={info.color} />
                                                </View>
                                                <Text style={[s.comercio, { flex: 1 }]}>
                                                    {cat === 'sin_categoria' ? 'Sin categoría' : cat}
                                                </Text>
                                                <Text style={s.monto}>{dinero(valor)}</Text>
                                            </View>
                                            <View style={s.catFondo}>
                                                <View
                                                    style={[
                                                        s.catBarra,
                                                        {
                                                            width: `${Math.min(Math.max(pct, 3), 100)}%`,
                                                            backgroundColor: info.color,
                                                        },
                                                    ]}
                                                />
                                            </View>
                                            <Text style={s.detalle}>{Math.round(pct)}% del total</Text>
                                        </View>
                                    );
                                })
                            )}
                        </View>

                        <View style={s.tarjeta}>
                            <Text style={s.seccion}>Por semana</Text>
                            {[...semanas].reverse().map((sem, i) => (
                                <View
                                    key={sem.start}
                                    style={[s.filaComercio, i > 0 && s.filaBorde]}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.comercio}>
                                            {i === 0 ? 'Esta semana' : `${sem.start} a ${sem.end}`}
                                        </Text>
                                        <Text style={s.detalle}>{sem.count} movimientos</Text>
                                    </View>
                                    <View style={s.derecha}>
                                        <Text style={s.monto}>{dinero(sem.total)}</Text>
                                        <Text
                                            style={[
                                                s.detalle,
                                                { color: colorCambio(sem.change_pct), fontWeight: '700' },
                                            ]}
                                        >
                                            {textoCambio(sem.change_pct)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                ) : null}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    cabecera: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 20 },
    titulo: { fontSize: 30, fontWeight: '800', color: colores.texto, letterSpacing: -0.8 },
    subtitulo: { fontSize: 14.5, color: colores.texto2, marginTop: 4 },

    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 22,
        padding: 18,
        marginHorizontal: 20,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colores.bordes,
    },
    seccion: { fontSize: 16, color: colores.texto, fontWeight: '800', marginBottom: 14 },

    grafico: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 170,
    },
    columna: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    barra: { width: 26, borderRadius: 8 },
    valorBarra: { fontSize: 10.5, color: colores.texto2, marginBottom: 4, fontWeight: '600' },
    letra: { fontSize: 12, color: colores.texto2, marginTop: 8, fontWeight: '600' },

    fila2: { flexDirection: 'row', gap: 14, marginHorizontal: 20, marginBottom: 14 },
    mini: {
        flex: 1,
        backgroundColor: colores.tarjeta,
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: colores.bordes,
    },
    miniIcono: {
        width: 34,
        height: 34,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    miniEtiqueta: { fontSize: 12.5, color: colores.texto2, fontWeight: '600' },
    miniValor: { fontSize: 19, color: colores.texto, fontWeight: '800', marginTop: 4, letterSpacing: -0.4 },

    textoGrande: { fontSize: 18, color: colores.texto, fontWeight: '800' },
    detalle: { fontSize: 12.5, color: colores.texto2, marginTop: 4 },

    filaComercio: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
    filaBorde: { borderTopWidth: 1, borderTopColor: colores.bordes },
    puesto: {
        width: 26,
        height: 26,
        borderRadius: 9,
        backgroundColor: '#E8ECFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    puestoTexto: { fontSize: 12.5, fontWeight: '800', color: colores.acento },
    comercio: { fontSize: 15, color: colores.texto, fontWeight: '600' },
    monto: { fontSize: 15, color: colores.texto, fontWeight: '800' },
    derecha: { alignItems: 'flex-end' },

    catFila: { marginBottom: 16 },
    catEncabezado: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    catIcono: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    catFondo: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EEF0F6',
        marginTop: 10,
        marginBottom: 2,
        overflow: 'hidden',
    },
    catBarra: { height: 8, borderRadius: 4 },

    cargando: { paddingVertical: 40 },
    error: { color: colores.gasto, textAlign: 'center', marginBottom: 12 },
});