import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { esAdmin } from '../../admin';
import { colores } from '../../tema';

const icono =
    (activo: any, inactivo: any) =>
    ({ color, focused }: any) => (
        <Ionicons name={focused ? activo : inactivo} size={24} color={color} />
    );

export default function TabsLayout() {
    // Antes de mostrar las pestañas revisamos el rol:
    // el admin va directo a su panel y nunca ve las pantallas del cliente.
    const [rol, setRol] = useState<'cargando' | 'admin' | 'cliente'>('cargando');

    useEffect(() => {
        esAdmin().then((admin) => setRol(admin ? 'admin' : 'cliente'));
    }, []);

    if (rol === 'cargando') {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colores.fondo,
                }}
            >
                <ActivityIndicator size="large" color={colores.acento} />
            </View>
        );
    }

    if (rol === 'admin') {
       return <Redirect href={'/resumen' as any} />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colores.acento,
                tabBarInactiveTintColor: colores.inactivo,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarStyle: {
                    backgroundColor: colores.barra,
                    borderTopColor: colores.bordes,
                    borderTopWidth: 1,
                    paddingTop: 6,
                },
            }}
        >
            <Tabs.Screen
                name="gastos"
                options={{ title: 'Inicio', tabBarIcon: icono('home', 'home-outline') }}
            />
            <Tabs.Screen
                name="transacciones"
                options={{ title: 'Movimientos', tabBarIcon: icono('receipt', 'receipt-outline') }}
            />
            <Tabs.Screen
                name="metas"
                options={{ title: 'Metas', tabBarIcon: icono('locate', 'locate-outline') }}
            />
            <Tabs.Screen
                name="reportes"
                options={{ title: 'Reportes', tabBarIcon: icono('bar-chart', 'bar-chart-outline') }}
            />
            <Tabs.Screen
                name="perfil"
                options={{ title: 'Perfil', tabBarIcon: icono('person', 'person-outline') }}
            />
        </Tabs>
    );
}