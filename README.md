# 🌸 Scanner Working Chat (`scanner-working-chat`)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-43%20passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%200%20errors-blue.svg)]()
[![Gentle-Pi Compatible](https://img.shields.io/badge/Gentle--Pi-v0.87.1%2B-purple.svg)]()

> **Dynamic Kinetic Telemetry & Real-Time Context Engine para Gentle-Pi y Gentle-Shell.**  
> Transforma el recuadro estático y aburrido del chat de Pi en un centro interactivo de telemetría: animación cinemática de cometa, cronómetro de latencia por turno, medidor espectral de consumo de contexto y protección inteligente contra pérdida de memoria.

---

## 📌 ¿Qué es y qué hace?

En el uso diario con agentes de código (Pi, Claude, etc.), el usuario suele mirar un recuadro estático mientras el modelo "piensa", sin saber cuánto tardará ni si la ventana de contexto está a punto de desbordarse.

**`scanner-working-chat`** es una extensión de interfaz quirúrgica que sustituye exclusivamente el marco superior del editor (`CustomEditor`) para proporcionar:
1. **Feedback cinético inmediato:** Sabes con certeza cuándo el agente está razonando o ejecutando herramientas complejas en segundo plano.
2. **Cronómetro de turno en vivo:** Mide la latencia exacta de ejecución de cada paso (`[2.4s]`, `[1m12s]`).
3. **Monitoreo de contexto en tiempo real:** Medidor espectral de 8 celdas térmicas y una alarma de retención automotriz (*latching alert*) que advierte antes de que el agente empiece a olvidar instrucciones.
4. **Resiliencia universal:** Detección de terminal automática con soporte desde terminales avanzadas con Nerd Fonts hasta entornos SSH/ASCII puros sin caracteres rotos.
5. **Cero invasión:** No toca tu tema, no altera tu footer de Git/modelos ni banners superiores.

---

## 🎨 Modos Visuales en Acción

### 1. Estado Reposo (`IDLE` — Esperando tu mensaje)
Muestra tu identidad de usuario, rotación sutil de la flor y el porcentaje limpio de contexto ocupado:

```text
╭─ 󰣇 carlos ✿  󰣇 Ctx: 18% ────────────────────────────────────────────────────────╮
│ Escribe tu mensaje para el agente...                                            │
│                                                                                 │
╰─────────────────────────────────────────────────────────────────────────────────╯
```

*(Si la sesión ha sufrido compactaciones de contexto, aparece automáticamente un discreto contador `📦×1`, `📦×2`, manteniéndose 100% invisible en sesiones nuevas).*

### 2. Estado Activo (`WORKING` — Agente pensando / ejecutando herramientas)
El badge superior se transforma en una consola de instrumentación fluida:

```text
╭─ ◆●•∙··  ✿  working… [3.2s]   │   Context ▰▰▰▰▰▱▱▱ 62% ─────────────────────────╮
│                                                                                 │
│  [ El agente está ejecutando herramientas o razonando en segundo plano ]        │
│                                                                                 │
╰─────────────────────────────────────────────────────────────────────────────────╯
```
* **Cometa de partículas (`◆●•∙··`):** Animación armónica continua a 80ms.
* **Cronómetro `[3.2s]`:** Duración acumulada del turno en curso.
* **Medidor Térmico:** Gradiente suave de 8 celdas que vira de Verde $\rightarrow$ Lima $\rightarrow$ Ámbar $\rightarrow$ Naranja $\rightarrow$ Rojo.

---

## 💎 ¿Por qué deberías usarlo? (Ventajas Clave)

| Característica | Editor Tradicional de Pi | Con `scanner-working-chat` |
|---|---|---|
| **Visibilidad de Estado** | Texto plano estático sin movimiento | Cometa cinemático + onda lumínica reflectiva |
| **Control de Contexto** | Debes consultar comandos o mirar logs | Medidor visual en tiempo real en cada frame |
| **Alarma de Saturación** | Ninguna (el agente olvida sin avisar) | Alarma senoidal en Rojo Neón Vivo (`#FF1E44`) con retención |
| **Historial de Compactaciones** | Desconocido (no sabes qué ha olvidado) | Contador discreto `📦×N` tras resumir contexto |
| **Latencia de Turnos** | Desconocida a simple vista | Cronómetro integrado de duración (`[X.Xs]`) |
| **Compatibilidad Terminal** | Puede romper caracteres si no hay fuentes | Autodetección: conmuta a ASCII puro si no hay UTF-8 |
| **Modo Zen / Silencioso** | No disponible | Comando `/scanner zen` para pausar animaciones al vuelo |
| **Convivencia con Temas** | Frecuentes conflictos de layout | Principio de mínima invasión (solo toca el editor) |

---

## 🚀 Instalación en 1 Paso (Para Todo Público)

No necesitas conocimientos avanzados de terminal ni compilar nada manualmente.

### 🌟 Método Rápido (Recomendado)
Abre tu terminal y pega este comando:

```bash
curl -fsSL https://raw.githubusercontent.com/WiloxDev/scanner-working-chat/main/install.sh | bash
```

**¿Qué hace este comando automáticamente por ti?**
1. Detecta tu nombre de usuario del sistema (no te pondrá nombres ajenos).
2. Detecta la ruta correcta de Pi (`Gentle-Pi` estándar o `Gentle-Shell` con perfiles como `agent-j0k3r`).
3. Descarga el código, instala y compila la versión más rápida y optimizada.
4. Genera tu archivo personal de configuración en `~/.scanner-chatrc.json`.

### 🔄 Aplicar en tu Pi
Una vez ejecutado el instalador, abre Pi (o si ya lo tienes abierto, escribe en el chat):
```text
/reload
```
¡Tu recuadro de chat cobrará vida al instante!

---

## 🤖 ¿Quieres que una IA lo instale por ti?

Si prefieres pedirle a Claude, Pi Coding Agent, Cursor o Copilot que haga el trabajo, solo cópiale este prompt:

```text
Instala en mi Pi la extensión scanner-working-chat ejecutando:
curl -fsSL https://raw.githubusercontent.com/WiloxDev/scanner-working-chat/main/install.sh | bash
y avísame cuando termines para hacer /reload. No toques mi tema principal.
```

---

## ⚡ Comandos Integrados en Pi

Durante tu sesión diaria en Pi, dispones de comandos directos sin tocar archivos:

* `/scanner zen`: Alterna instantáneamente entre el **Modo Dinámico** (con cometa y animaciones) y el **Modo Zen** (estático, ideal para máxima concentración o ahorro de batería).
* `/scanner reload`: Recarga tus cambios en `~/.scanner-chatrc.json` en caliente sin reiniciar la sesión. Si cometiste un error de sintaxis en el JSON, te avisa en pantalla con una notificación preventiva.

---

## 🎛️ Configuración a Tu Gusto (`~/.scanner-chatrc.json`)

Todo aspecto visual es 100% configurable mediante un archivo JSON sencillo en tu carpeta de usuario:

```json
{
  "username": "carlos",
  "userIcon": "󰣇",
  "flowerIcon": "✿",
  "showCompactionCount": true,
  "compactionIcon": "📦",
  "zenMode": false,
  "showWorkingDuration": true,
  "showContextInIdle": true,
  "enableComet": true,
  "cometSpeedMs": 80,
  "cometTrackWidth": 22,
  "warningThreshold": 70,
  "criticalThreshold": 90,
  "resetThreshold": 15,
  "theme": {
    "borderColor": "#5CB8C7",
    "userNameColor": "#7BC88F",
    "flowerColor": "#5CB8C7",
    "separatorColor": "#8A4E9E",
    "labelColor": "#5CB8C7",
    "emptyCellColor": "#465564",
    "neonRedPulsePeak": "#FF1E44"
  }
}
```

Para ver la guía exhaustiva de personalización (estilos Cyberpunk, Minimalista ASCII y paletas personalizadas), consulta el [MANUAL.md](./MANUAL.md).

---

## 🛡️ Principio de Convivencia y Arquitectura Robusta

* **No invasivo:** No toca banners de bienvenida (`setHeader`), ni pie de página de Git y modelos (`setFooter`), ni barras laterales de estado (`setWidget`).
* **Coexistencia con Temas y Editores:** Pi admite un único `CustomEditor` activo a la vez. Cuando tanto `scanner-working-chat` como un tema con editor propio (ej. `wilox-theme`) están instalados, el control del área del editor depende del orden de inicialización en `session_start` (el último registrado toma el editor, mientras los headers y footers del tema permanecen intactos).
* **Protección contra actualizaciones:** Construido usando contratos limpios de API pública, sin depender de variables privadas que puedan romperse con futuras versiones de Pi.
* **43 Pruebas Unitarias (TDD):** Código auditado quirúrgicamente con pruebas automatizadas de ancho invariante, degradación elástica en terminales angostas y sanitización estricta.

```bash
npm test
npm run typecheck
```

---

## 📂 Estructura del Proyecto

* [`install.sh`](./install.sh) — Auto-instalador para cualquier sistema Linux/macOS/WSL.
* [`MANUAL.md`](./MANUAL.md) — Manual detallado de configuración y temas.
* [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Diagramas Mermaid de arquitectura y flujo de ejecución.
* [`AUDIT_REPORT.md`](./AUDIT_REPORT.md) — Reporte técnico de auditoría y estabilización quirúrgica.
* [`AI_INSTALL.md`](./AI_INSTALL.md) — Protocolo automatizado para asistentes de IA.

---

## 📄 Licencia

Distribuido bajo licencia MIT. Desarrollado con esmero para la comunidad de **Gentle-Pi** y **Gentle-Shell**.
