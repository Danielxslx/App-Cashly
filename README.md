# Cashly

App móvil para llevar el control de gastos personales, hecha con **React Native (Expo) y TypeScript**. Se conecta a una API propia (Node.js + Express + PostgreSQL en Supabase) con cifrado por usuario, verificación de correo y autenticación en dos pasos.

## Qué hace

### Cliente

- **Cuenta segura:** registro con verificación de correo (código de 6 dígitos), inicio de sesión con verificación en dos pasos (Google o Microsoft Authenticator) y recuperación de cuenta con llave de recuperación.
- **Gastos:** registro de gastos con tarjeta o en efectivo, con categoría.
- **Movimientos:** lista agrupada por día, búsqueda, filtro por categoría, edición y borrado deslizando.
- **Metas mensuales:** límite por categoría o de gasto total, con barra de progreso y estado (en camino, cerca del límite, excedida).
- **Reportes:** gasto de los últimos 7 días, resumen por categoría del mes y comparación semanal.
- **Perfil:** cambio de contraseña y cierre de sesión.
- **Captura automática (Apple Pay):** un Atajo de iPhone envía cada pago con tarjeta al servidor mediante un token de captura que se genera desde Perfil.
- **Guía del Atajo:** desde Perfil ("¿Cómo lo configuro?") se abre una guía de 13 pasos dentro de la app para configurar la automatización en el iPhone.

### Administrador

El administrador tiene su propia experiencia: al iniciar sesión va directo a su panel y no ve las pantallas del cliente.

- **Resumen:** métricas por período (7 días, 30 días, 90 días o 1 año): cuentas totales, nuevas, activas, con sesión abierta, con correo verificado y con 2FA; transacciones, promedio por día y por usuario activo, metas nuevas, inicios de sesión y Atajos de Apple Pay activos. Incluye una gráfica de evolución de transacciones, registros, metas o logins, y los totales históricos.
- **Cuentas:** lista de cuentas con su estado, número de transacciones y metas, fecha de registro y última actividad; búsqueda por correo exacto; filtros (sin verificar, sin 2FA, sin gastos); eliminación de una cuenta o de la última creada.
- **Privacidad por diseño:** el administrador solo ve métricas. Los correos, montos, comercios y categorías están cifrados con la llave de cada usuario, por lo que no puede leerlos.

**Cómo se define el administrador:** es la cuenta cuyo correo está en la variable `ADMIN_EMAIL` de la API, siempre que tenga el correo verificado y la verificación en dos pasos activa. La app pregunta a la API (`GET /v1/admin/stats`) si el usuario es administrador: si responde bien, muestra el panel; si responde `403`, muestra la app de cliente.

## Tecnologías

- React Native, Expo y Expo Router
- TypeScript
- EAS Update para publicar actualizaciones
- API REST: [API-JDS](https://github.com/SEBASWILL/API-JDS) (Node.js, Express, PostgreSQL en Supabase)

## Estructura

```
src/
├─ app/
│  ├─ (tabs)/            Pestañas del cliente: gastos (Inicio), transacciones (Movimientos), metas, reportes y perfil
│  ├─ (admin)/           Pestañas del administrador: resumen y cuentas
│  ├─ _layout.tsx        Navegación principal
│  ├─ index.tsx          Inicio de sesión
│  ├─ registro.tsx, verificar.tsx, mfa.tsx, codigo.tsx, recuperar.tsx   Registro, verificación y recuperación
│  └─ guia-atajo.tsx     Guía paso a paso del Atajo de Apple Pay
├─ api.ts                Peticiones a la API (con renovación automática de la sesión)
├─ admin.ts              Funciones del administrador (estadísticas, cuentas, búsqueda, eliminar)
├─ EncabezadoAdmin.tsx   Encabezado del panel con el botón de cerrar sesión
├─ config.ts             Dirección de la API (nube o local)
├─ sesion.ts             Manejo de tokens y datos de la sesión
├─ tema.ts               Colores de la app
└─ ui.tsx                Componentes reutilizables (Campo, Boton)
```

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

### Contra la API local

1. Clona y arranca la API (ver su README). Para desarrollo basta un `.env` con `PEPPER`, `DATABASE_URL=pglite:./data/pg` y, si quieres probar el panel, `ADMIN_EMAIL`. Crea la carpeta `data` antes de arrancar. Sin Gmail configurado, los códigos de verificación se muestran en la terminal de la API.
2. Busca la IP de tu computador con `ipconfig` (Windows) o `ifconfig` (macOS) y ponla en `LOCAL` dentro de `src/config.ts`, con `USAR_NUBE = false`.
3. El celular y el computador deben estar en la misma red Wi-Fi. Para comprobarlo, abre `http://TU_IP:3000/v1/admin/stats` en el navegador del celular: si responde un error en JSON, hay conexión.
4. Corre `npx expo start` y abre la app con Expo Go.

## Publicar una actualización

La app se distribuye con EAS Update (rama `production`). Quienes ya la tienen en Expo Go reciben el cambio al cerrarla y volver a abrirla.

```bash
npx eas-cli update --branch production --message "Descripción del cambio"
```

- Antes de publicar, confirma que `USAR_NUBE = true`. Si publicas apuntando a la API local, la app deja de funcionar para todos.
- Si PowerShell bloquea `npx`, usa `npx.cmd` o abre la terminal en CMD.
- Si pide iniciar sesión: `npx eas-cli login`.

## Equipo

| Integrante | Rol |
|---|---|
| Daniel | Requerimientos y frontend (app móvil) |
| Wilches | Backend (API) y página web |
| José | Pruebas |

## Siguiente fase

- Categoría automática para los gastos capturados con Apple Pay
- Varias cuentas en la misma app, con cambio rápido entre ellas
- Exportar y borrar los datos propios (Ley 1581 de 2012)
- Registro de ingresos
- Captura pasiva de gastos y reconocimiento de mensajes con expresiones regulares
- Funciones de inteligencia artificial (plan premium)