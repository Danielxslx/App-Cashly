import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colores } from '../../tema';

const icono = (emoji: string) => () => <Text style={{ fontSize: 22 }}>{emoji}</Text>;

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colores.acento2,
                tabBarInactiveTintColor: colores.texto2,
                tabBarStyle: {
                    backgroundColor: colores.barra,
                    borderTopColor: colores.bordes,
                },
            }}
        >
            <Tabs.Screen name="gastos" options={{ title: 'Inicio', tabBarIcon: icono('🏠') }} />
            <Tabs.Screen name="transacciones" options={{ title: 'Movimientos', tabBarIcon: icono('🧾') }} />
            <Tabs.Screen name="metas" options={{ title: 'Metas', tabBarIcon: icono('🎯')}}/>
            <Tabs.Screen name="reportes" options={{ title: 'Reportes', tabBarIcon: icono('📊') }} />
            <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('👤') }} />
        </Tabs>
    );
}