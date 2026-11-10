import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';
import { colores } from './tema';

// Logo de Cashly (usa el ícono de la app)
export function Logo({ tam = 72 }: { tam?: number }) {
    return (
        <Image
            source={require('../assets/images/icon.png')}
            style={{ width: tam, height: tam, borderRadius: tam * 0.28 }}
        />
    );
}

// Contenedor de las pantallas de acceso (login, registro, etc.)
export function PantallaAuth({ children }: { children: ReactNode }) {
    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colores.fondo }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.pantalla}
            >
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Campo de texto con ícono (y ojito para mostrar la contraseña)
export function Campo({
    icono,
    clave = false,
    ...resto
}: TextInputProps & { icono: string; clave?: boolean }) {
    const [ver, setVer] = useState(false);
    return (
        <View style={s.campo}>
            <Ionicons name={icono as any} size={20} color={colores.placeholder} />
            <TextInput
                style={s.campoInput}
                placeholderTextColor={colores.placeholder}
                secureTextEntry={clave && !ver}
                {...resto}
            />
            {clave ? (
                <Pressable onPress={() => setVer(!ver)} hitSlop={12}>
                    <Ionicons
                        name={ver ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colores.placeholder}
                    />
                </Pressable>
            ) : null}
        </View>
    );
}

export function Boton({
    texto,
    onPress,
    cargando = false,
    tipo = 'principal',
}: {
    texto: string;
    onPress: () => void;
    cargando?: boolean;
    tipo?: 'principal' | 'secundario';
}) {
    const principal = tipo === 'principal';
    return (
        <Pressable
            onPress={onPress}
            disabled={cargando}
            style={({ pressed }) => [
                s.boton,
                principal ? s.botonPrincipal : s.botonSecundario,
                pressed && { opacity: 0.85 },
            ]}
        >
            {cargando ? (
                <ActivityIndicator color={principal ? '#FFFFFF' : colores.acento} />
            ) : (
                <Text style={[s.botonTexto, { color: principal ? '#FFFFFF' : colores.texto }]}>
                    {texto}
                </Text>
            )}
        </Pressable>
    );
}

export function Separador({ texto = 'o' }: { texto?: string }) {
    return (
        <View style={s.separador}>
            <View style={s.linea} />
            <Text style={s.separadorTexto}>{texto}</Text>
            <View style={s.linea} />
        </View>
    );
}

export function NotaSeguridad() {
    return (
        <View style={s.nota}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colores.ok} />
            <Text style={s.notaTexto}>Protegido con verificación en dos pasos</Text>
        </View>
    );
}

const s = StyleSheet.create({
    pantalla: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingVertical: 60,
    },
    campo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colores.tarjeta,
        borderWidth: 1.5,
        borderColor: colores.bordes,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 15,
        marginBottom: 12,
    },
    campoInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: colores.texto,
        padding: 0,
    },
    boton: {
        paddingVertical: 17,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botonPrincipal: {
        backgroundColor: colores.acento,
        shadowColor: colores.acento,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    botonSecundario: {
        backgroundColor: colores.tarjeta,
        borderWidth: 1.5,
        borderColor: colores.bordes,
    },
    botonTexto: {
        fontSize: 16,
        fontWeight: '800',
    },
    separador: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 22,
    },
    linea: {
        flex: 1,
        height: 1,
        backgroundColor: colores.bordes,
    },
    separadorTexto: {
        color: colores.placeholder,
        fontSize: 13,
    },
    nota: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 26,
    },
    notaTexto: {
        fontSize: 12.5,
        color: colores.texto2,
        fontWeight: '600',
    },
});