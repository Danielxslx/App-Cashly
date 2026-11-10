import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { peticion } from '../../api';
import { categoriaDe, categorias, colores } from '../../tema';

type Meta = {
    id: number;
    category: string | null;
    limit: number;
    spent: number;
    remaining: number;
    percent: number;
    status: 'ok' | 'warning' | 'exceeded';
    daily_allowance?: number | null;
    projected?: number | null;
};

type Progreso = {
    days_in_month: number;
    days_elapsed: number;
    days_left: number;
    goals: Meta[];
};

const dinero = (n: number) => `$ ${Math.round(Number(n) || 0).toLocaleString('es-CO')}`;

const colorEstado = (e: string) =>
    e === 'exceeded' ? colores.gasto : e === 'warning' ? colores.alerta : colores.ok;

const textoEstado = (e: string) =>
    e === 'exceeded' ? 'Excedida' : e === 'warning' ? 'Cerca del límite' : 'En camino';

const leerJson = async (r: Response) => {
    const t = await r.text();
    try {
        return JSON.parse(t);
    } catch {
        return {};
    }
};

export default function Metas() {
    const [datos, setDatos] = useState<Progreso | null>(null);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [errorLista, setErrorLista] = useState('');

    // hoja de crear / editar
    const [abierta, setAbierta] = useState(false);
    const [editando, setEditando] = useState<Meta | null>(null);
    const [categoria, setCategoria] = useState<string | null>(null);
    const [limite, setLimite] = useState('');
    const [errorForm, setErrorForm] = useState('');
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            const r = await peticion('/goals/progress?tz=America/Bogota');
            const d = await leerJson(r);
            if (r.ok) {
                setDatos(d);
                setErrorLista('');
            } else {
                setErrorLista(d.error ?? 'No se pudieron cargar las metas');
            }
        } catch {
            setErrorLista('No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [cargar])
    );

    const abrirNueva = () => {
        setEditando(null);
        setCategoria(null);
        setLimite('');
        setErrorForm('');
        setAbierta(true);
    };

    const abrirEditar = (m: Meta) => {
        setEditando(m);
        setCategoria(m.category);
        setLimite(String(Math.round(m.limit)));
        setErrorForm('');
        setAbierta(true);
    };

    const guardar = async () => {
        setErrorForm('');
        const valor = Number(limite.replace(/[^\d]/g, ''));
        if (!valor || valor <= 0) {
            setErrorForm('Escribe un límite mayor a 0');
            return;
        }
        setGuardando(true);
        try {
            const cuerpo: any = { limit: valor };
            if (editando) {
                cuerpo.category = categoria;
            } else if (categoria) {
                cuerpo.category = categoria;
            }
            const r = await peticion(editando ? `/goals/${editando.id}` : '/goals', {
                method: editando ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuerpo),
            });
            const d = await leerJson(r);
            if (r.ok) {
                setAbierta(false);
                cargar();
            } else if (r.status === 409) {
                setErrorForm('Ya tienes una meta para esa categoría');
            } else {
                setErrorForm(d.error ?? 'No se pudo guardar la meta');
            }
        } catch {
            setErrorForm('No se pudo conectar con el servidor');
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = () => {
        if (!editando) return;
        Alert.alert('Eliminar meta', '¿Seguro que quieres eliminar esta meta?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const r = await peticion(`/goals/${editando.id}`, { method: 'DELETE' });
                        if (r.ok || r.status === 204) {
                            setAbierta(false);
                            cargar();
                        } else {
                            setErrorForm('No se pudo eliminar la meta');
                        }
                    } catch {
                        setErrorForm('No se pudo conectar con el servidor');
                    }
                },
            },
        ]);
    };

    const metas = datos?.goals ?? [];

    return (
        <View style={s.pantalla}>
            <ScrollView
                contentContainerStyle={s.contenido}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={() => {
                            setRefrescando(true);
                            cargar();
                        }}
                        tintColor={colores.acento}
                    />
                }
            >
                <Text style={s.titulo}>Metas</Text>
                <Text style={s.subtitulo}>
                    {datos
                        ? `Te quedan ${datos.days_left} días este mes`
                        : 'Controla cuánto gastas cada mes'}
                </Text>

                {cargando ? (
                    <ActivityIndicator color={colores.acento} style={{ marginTop: 60 }} />
                ) : errorLista ? (
                    <View style={s.vacio}>
                        <Ionicons name="cloud-offline-outline" size={40} color={colores.placeholder} />
                        <Text style={s.vacioTitulo}>{errorLista}</Text>
                        <Pressable style={s.reintentar} onPress={cargar}>
                            <Text style={s.reintentarTexto}>Reintentar</Text>
                        </Pressable>
                    </View>
                ) : metas.length === 0 ? (
                    <View style={s.vacio}>
                        <View style={s.vacioIcono}>
                            <Ionicons name="locate-outline" size={34} color={colores.acento} />
                        </View>
                        <Text style={s.vacioTitulo}>Aún no tienes metas</Text>
                        <Text style={s.vacioTexto}>
                            Define un límite mensual por categoría o para todo tu gasto y te avisamos
                            cuando te acerques.
                        </Text>
                    </View>
                ) : (
                    metas.map((m) => {
                        const cat = m.category ? categoriaDe(m.category) : null;
                        const color = colorEstado(m.status);
                        const ancho = Math.max(0, Math.min(100, Number(m.percent) || 0));
                        return (
                            <Pressable key={m.id} style={s.tarjeta} onPress={() => abrirEditar(m)}>
                                <View style={s.fila}>
                                    <View
                                        style={[
                                            s.icono,
                                            { backgroundColor: cat ? cat.fondo : '#E8ECFF' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={(cat ? cat.icono : 'wallet-outline') as any}
                                            size={22}
                                            color={cat ? cat.color : colores.acento}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.nombre}>{m.category ?? 'Gasto total'}</Text>
                                        <Text style={s.limite}>Límite {dinero(m.limit)}</Text>
                                    </View>
                                    <View style={[s.chip, { backgroundColor: color + '1F' }]}>
                                        <Text style={[s.chipTexto, { color }]}>
                                            {textoEstado(m.status)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={s.barraFondo}>
                                    <View
                                        style={[
                                            s.barra,
                                            { width: `${ancho}%`, backgroundColor: color },
                                        ]}
                                    />
                                </View>

                                <View style={s.fila}>
                                    <Text style={s.gastado}>
                                        <Text style={{ color: colores.texto, fontWeight: '800' }}>
                                            {dinero(m.spent)}
                                        </Text>{' '}
                                        gastado · {Math.round(Number(m.percent) || 0)}%
                                    </Text>
                                </View>
                                <Text style={s.detalle}>
                                    {m.remaining >= 0
                                        ? `Te quedan ${dinero(m.remaining)}`
                                        : `Te pasaste por ${dinero(-m.remaining)}`}
                                    {m.daily_allowance != null && m.remaining > 0
                                        ? ` · ${dinero(m.daily_allowance)} por día`
                                        : ''}
                                </Text>
                            </Pressable>
                        );
                    })
                )}
            </ScrollView>

            <Pressable style={s.fab} onPress={abrirNueva}>
                <Ionicons name="add" size={26} color="#FFFFFF" />
                <Text style={s.fabTexto}>Nueva meta</Text>
            </Pressable>

            <Modal visible={abierta} transparent animationType="slide" onRequestClose={() => setAbierta(false)}>
                <KeyboardAvoidingView
                    style={s.fondoModal}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Pressable style={{ flex: 1 }} onPress={() => setAbierta(false)} />
                    <View style={s.hoja}>
                        <View style={s.agarre} />
                        <Text style={s.hojaTitulo}>{editando ? 'Editar meta' : 'Nueva meta'}</Text>

                        <Text style={s.etiqueta}>Categoría</Text>
                        <View style={s.rejilla}>
                            <Pressable
                                style={[s.opcion, categoria === null && s.opcionActiva]}
                                onPress={() => setCategoria(null)}
                            >
                                <Ionicons
                                    name="wallet-outline"
                                    size={20}
                                    color={categoria === null ? colores.acento : colores.texto2}
                                />
                                <Text style={[s.opcionTexto, categoria === null && { color: colores.acento }]}>
                                    Total
                                </Text>
                            </Pressable>
                            {Object.keys(categorias).map((nombre) => {
                                const c = categorias[nombre];
                                const activa = categoria === nombre;
                                return (
                                    <Pressable
                                        key={nombre}
                                        style={[s.opcion, activa && { borderColor: c.color, backgroundColor: c.fondo }]}
                                        onPress={() => setCategoria(nombre)}
                                    >
                                        <Ionicons name={c.icono as any} size={20} color={activa ? c.color : colores.texto2} />
                                        <Text style={[s.opcionTexto, activa && { color: c.color }]}>{nombre}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Text style={s.etiqueta}>Límite mensual</Text>
                        <View style={s.campoMonto}>
                            <Text style={s.signo}>$</Text>
                            <TextInput
                                style={s.inputMonto}
                                placeholder="0"
                                placeholderTextColor="#C5CAD6"
                                keyboardType="number-pad"
                                value={limite}
                                onChangeText={setLimite}
                            />
                        </View>

                        {errorForm ? <Text style={s.error}>{errorForm}</Text> : null}

                        <Pressable style={[s.guardar, guardando && { opacity: 0.7 }]} onPress={guardar} disabled={guardando}>
                            {guardando ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={s.guardarTexto}>{editando ? 'Guardar cambios' : 'Crear meta'}</Text>
                            )}
                        </Pressable>

                        {editando ? (
                            <Pressable style={s.borrar} onPress={eliminar}>
                                <Ionicons name="trash-outline" size={18} color={colores.gasto} />
                                <Text style={s.borrarTexto}>Eliminar meta</Text>
                            </Pressable>
                        ) : null}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 20, paddingTop: 64, paddingBottom: 120 },
    titulo: { fontSize: 30, fontWeight: '800', color: colores.texto, letterSpacing: -0.8 },
    subtitulo: { fontSize: 14.5, color: colores.texto2, marginTop: 4, marginBottom: 22 },

    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colores.bordes,
    },
    fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    icono: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    nombre: { fontSize: 16, fontWeight: '800', color: colores.texto },
    limite: { fontSize: 13, color: colores.texto2, marginTop: 2 },
    chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
    chipTexto: { fontSize: 11.5, fontWeight: '800' },
    barraFondo: {
        height: 10,
        borderRadius: 999,
        backgroundColor: '#EEF0F6',
        overflow: 'hidden',
        marginTop: 16,
        marginBottom: 12,
    },
    barra: { height: 10, borderRadius: 999 },
    gastado: { fontSize: 13.5, color: colores.texto2 },
    detalle: { fontSize: 13, color: colores.texto2, marginTop: 4 },

    vacio: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
    vacioIcono: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#E8ECFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    vacioTitulo: { fontSize: 18, fontWeight: '800', color: colores.texto, textAlign: 'center', marginTop: 8 },
    vacioTexto: { fontSize: 14.5, color: colores.texto2, textAlign: 'center', marginTop: 8, lineHeight: 21 },
    reintentar: { marginTop: 18, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, backgroundColor: colores.tarjeta, borderWidth: 1.5, borderColor: colores.bordes },
    reintentarTexto: { color: colores.acento, fontWeight: '800' },

    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colores.acento,
        paddingVertical: 14,
        paddingLeft: 14,
        paddingRight: 20,
        borderRadius: 20,
        shadowColor: colores.acento,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    fabTexto: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

    fondoModal: { flex: 1, backgroundColor: 'rgba(10,15,30,0.45)' },
    hoja: {
        backgroundColor: colores.tarjeta,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 22,
        paddingBottom: 34,
    },
    agarre: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colores.bordes, marginBottom: 16 },
    hojaTitulo: { fontSize: 22, fontWeight: '800', color: colores.texto, marginBottom: 18 },
    etiqueta: { fontSize: 12.5, fontWeight: '700', color: colores.texto2, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
    rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    opcion: {
        width: '31.5%',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        backgroundColor: colores.campo,
    },
    opcionActiva: { borderColor: colores.acento, backgroundColor: '#E8ECFF' },
    opcionTexto: { fontSize: 12.5, fontWeight: '700', color: colores.texto2 },
    campoMonto: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colores.campo,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    signo: { fontSize: 24, fontWeight: '800', color: colores.texto2, marginRight: 8 },
    inputMonto: { flex: 1, fontSize: 26, fontWeight: '800', color: colores.texto, paddingVertical: 14 },
    error: { color: colores.gasto, textAlign: 'center', marginBottom: 10 },
    guardar: {
        backgroundColor: colores.acento,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 6,
    },
    guardarTexto: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
    borrar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
    borrarTexto: { color: colores.gasto, fontWeight: '700', fontSize: 14.5 },
});