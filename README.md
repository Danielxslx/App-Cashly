# Cashly

App móvil para llevar el control de gastos personales, hecha con **React Native (Expo) y TypeScript**. Se conecta a una API propia (Node.js + Express + SQLite) con verificación de correo y autenticación en dos pasos.

## Qué hace

- **Cuenta segura:** registro con verificación de correo (código de 6 dígitos), inicio de sesión con verificación en dos pasos (Microsoft o Google Authenticator) y recuperación de cuenta con clave de recuperación.
- **Gastos:** registro de gastos con tarjeta o en efectivo, con categoría.
- **Movimientos:** lista agrupada por día, búsqueda, filtro por categoría, edición y borrado deslizando.
- **Metas mensuales:** límite por categoría o de gasto total, con barra de progreso y estado (en camino, cerca del límite, excedida).
- **Reportes:** gasto de los últimos 7 días, resumen por categoría del mes y comparación semanal.
- **Perfil:** cambio de contraseña y cierre de sesión.
- **Captura automática (Apple Pay):** un Atajo de iPhone envía cada pago con tarjeta al servidor mediante un token de captura que se genera desde Perfil.

## Tecnologías

- React Native, Expo y Expo Router
- TypeScript
- API REST: [API-JDS](https://github.com/SEBASWILL/API-JDS) (Node.js, Express, SQLite)

## Cómo ejecutarla

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Revisa `src/config.ts`: con `USAR_NUBE = true` usa la API desplegada (`https://api.cashly.lat/v1`); con `false` usa la API local.

3. Inicia el proyecto y abre la app con Expo Go:

   ```bash
   npx expo start
   ```

## Equipo

| Integrante | Rol |
|---|---|
| Daniel | Requerimientos y frontend (app móvil) |
| Wilches | Backend (API) |
| José | Pruebas |

## Siguiente fase

- Registro de ingresos
- Captura pasiva de gastos y reconocimiento de mensajes con expresiones regulares
- Funciones de inteligencia artificial