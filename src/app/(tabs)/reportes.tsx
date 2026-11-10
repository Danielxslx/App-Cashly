import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { peticion } from '../../api';
import { colores } from '../../tema';

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
    return pct > 0 ? colores.gasto : '#22C55E';
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

    return (
        <View style={styles.contenedor}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={refrescar}
                        tintColor={colores.texto}
                    />
                }
            >
                <View style={styles.cabecera}>
                    <Text style={styles.titulo}>Reportes</Text>
                    <Text style={styles.subtituloCab}>Tus últimos 7 días</Text>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {cargando ? (
                    <ActivityIndicator color={colores.acento2} style={styles.cargando} />
                ) : resumen ? (
                    <>
                        <View style={styles.tarjeta}>
                            <Text style={styles.seccion}>Gasto por día</Text>
                            <View style={styles.grafico}>
                                {dias.map((d) => (
                                    <View key={d.date} style={styles.columna}>
                                        <Text style={styles.valorBarra}>
                                            {d.total > 0 ? Math.round(d.total / 1000) + 'k' : ''}
                                        </Text>
                                        <View
                                            style={[
                                                styles.barra,
                                                { height: Math.max((d.total / maximo) * 120, 4) },
                                            ]}
                                        />
                                        <Text style={styles.letra}>{letraDia(d.date)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.fila2}>
                            <View style={styles.mini}>
                                <Text style={styles.miniEtiqueta}>Total</Text>
                                <Text style={styles.miniValor}>{dinero(resumen.total)}</Text>
                            </View>
                            <View style={styles.mini}>
                                <Text style={styles.miniEtiqueta}>Promedio diario</Text>
                                <Text style={styles.miniValor}>{dinero(resumen.avg_per_day)}</Text>
                            </View>
                        </View>

                        <View style={styles.tarjeta}>
                            <Text style={styles.seccion}>Día que más gastaste</Text>
                            <Text style={styles.textoGrande}>
                                {resumen.max_day.total > 0
                                    ? `${resumen.max_day.date} · ${dinero(resumen.max_day.total)}`
                                    : 'Sin gastos esta semana'}
                            </Text>
                            <Text style={styles.detalle}>{resumen.zero_days} días sin gastar</Text>
                        </View>

                        <View style={styles.tarjeta}>
                            <Text style={styles.seccion}>Dónde más gastas</Text>
                            {resumen.top_merchants.length === 0 ? (
                                <Text style={styles.detalle}>Aún no hay datos.</Text>
                            ) : (
                                resumen.top_merchants.map((c: any) => (
                                    <View key={c.merchant} style={styles.filaComercio}>
                                        <Text style={styles.comercio}>{c.merchant}</Text>
                                        <Text style={styles.comercio}>{dinero(c.total)}</Text>
                                    </View>
                                ))
                            )}
                        </View>

                        <View style={styles.tarjeta}>
                            <Text style={styles.seccion}>Gasto por categoría (este mes)</Text>
                            {categorias.length === 0 ? (
                                <Text style={styles.detalle}>Aún no hay gastos este mes.</Text>
                            ) : (
                                categorias.map(([cat, valor]) => (
                                    <View key={cat} style={styles.catFila}>
                                        <View style={styles.catEncabezado}>
                                            <Text style={styles.comercio}>
                                                {cat === 'sin_categoria' ? 'Sin categoría' : cat}
                                            </Text>
                                            <Text style={styles.comercio}>{dinero(valor)}</Text>
                                        </View>
                                        <View style={styles.catFondo}>
                                            <View
                                                style={[
                                                    styles.catBarra,
                                                    { width: `${Math.max((valor / totalMes) * 100, 3)}%` },
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.detalle}>
                                            {Math.round((valor / totalMes) * 100)}% del total
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>

                        <View style={styles.tarjeta}>
                            <Text style={styles.seccion}>Por semana</Text>
                            {[...semanas].reverse().map((s, i) => (
                                <View key={s.start} style={styles.filaComercio}>
                                    <View>
                                        <Text style={styles.comercio}>
                                            {i === 0 ? 'Esta semana' : `${s.start} a ${s.end}`}
                                        </Text>
                                        <Text style={styles.detalle}>{s.count} movimientos</Text>
                                    </View>
                                    <View style={styles.derecha}>
                                        <Text style={styles.comercio}>{dinero(s.total)}</Text>
                                        <Text style={[styles.detalle, { color: colorCambio(s.change_pct) }]}>
                                            {textoCambio(s.change_pct)}
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

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: colores.fondo,
    },
    cabecera: {
        backgroundColor: colores.acento2,
        paddingTop: 70,
        paddingBottom: 28,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 20,
    },
    titulo: {
        fontSize: 28,
        color: colores.textoGastos,
        fontWeight: 'bold',
    },
    subtituloCab: {
        fontSize: 14,
        color: colores.textoGastos,
        opacity: 0.8,
        marginTop: 4,
    },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        padding: 18,
        marginHorizontal: 20,
        marginBottom: 14,
    },
    seccion: {
        fontSize: 16,
        color: colores.texto,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    grafico: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 170,
    },
    columna: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    barra: {
        width: 22,
        borderRadius: 6,
        backgroundColor: colores.acento,
    },
    valorBarra: {
        fontSize: 10,
        color: colores.texto2,
        marginBottom: 4,
    },
    letra: {
        fontSize: 12,
        color: colores.texto2,
        marginTop: 6,
    },
    fila2: {
        flexDirection: 'row',
        gap: 14,
        marginHorizontal: 20,
        marginBottom: 14,
    },
    mini: {
        flex: 1,
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        padding: 18,
    },
    miniEtiqueta: {
        fontSize: 12,
        color: colores.texto2,
    },
    miniValor: {
        fontSize: 18,
        color: colores.texto,
        fontWeight: 'bold',
        marginTop: 4,
    },
    textoGrande: {
        fontSize: 18,
        color: colores.texto,
        fontWeight: 'bold',
    },
    detalle: {
        fontSize: 12,
        color: colores.texto2,
        marginTop: 4,
    },
    filaComercio: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    comercio: {
        fontSize: 15,
        color: colores.texto,
    },
    cargando: {
        paddingVertical: 24,
    },
    error: {
        color: colores.gasto,
        textAlign: 'center',
        marginBottom: 12,
    },
    derecha: {
        alignItems: 'flex-end',
    },
    catFila: {
        marginBottom: 14,
    },
    catEncabezado: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    catFondo: {
        height: 8,
        borderRadius: 4,
        backgroundColor: colores.fondo,
        marginVertical: 6,
        overflow: 'hidden',
    },
    catBarra: {
        height: 8,
        borderRadius: 4,
        backgroundColor: colores.acento,
    },
});