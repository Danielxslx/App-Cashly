import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colores } from '../../tema';

const icono =
    (activo: any, inactivo: any) =>
    ({ color, focused }: any) => (
        <Ionicons name={focused ? activo : inactivo} size={24} color={color} />
    );

export default function AdminLayout() {
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
                name="resumen"
                options={{ title: 'Resumen', tabBarIcon: icono('stats-chart', 'stats-chart-outline') }}
            />
            <Tabs.Screen
                name="cuentas"
                options={{ title: 'Cuentas', tabBarIcon: icono('people', 'people-outline') }}
            />
        </Tabs>
    );
}