# Scrabble · El marcador

Aplicación sencilla en React para llevar la puntuación de 2 a 4 jugadores, pensada para móvil.

## Ejecutar

Requiere Node.js 22.12 o superior.

```bash
npm install
npm run dev
```

Abre la URL que indica Vite. Para probar desde el móvil, conecta ambos dispositivos a la misma Wi-Fi y abre la URL de red que muestra Vite. El cortafuegos debe permitir esa conexión.

```bash
npm test        # Pruebas de puntuaciones y almacenamiento
npm run build  # Genera dist/ para publicar como web estática
npm run preview # Prueba la versión compilada
```

## Uso

- Elige entre 2 y 4 jugadores e introduce sus nombres (opcionales).
- Añade puntos a cada jugador. Se muestran su total y sus registros.
- Puedes deshacer la última puntuación de cada jugador y añadir puntos negativos para ajustes.
- El tema sigue al dispositivo por defecto; también puedes elegir claro u oscuro.
- La partida y el tema se guardan automáticamente en `localStorage` y se recuperan al recargar.
- «Nueva partida» pide confirmación antes de borrar el marcador.

Los datos se guardan solo en el navegador y origen donde juegas; no se sincronizan entre dispositivos. No hay servidor ni base de datos: Node se utiliza para el desarrollo y la compilación con Vite.
