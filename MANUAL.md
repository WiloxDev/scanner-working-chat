# 📖 Manual de Configuración y Personalización

`Scanner Working Chat` permite personalizar cada aspecto estético y funcional sin tocar el código fuente, mediante el archivo `~/.scanner-chatrc.json`.

---

## ⚙️ Estructura Completa de `~/.scanner-chatrc.json`

```json
{
  "username": "Wilox",
  "userIcon": "󰣇",
  "flowerIcon": "✿",
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
    "separatorColor": "#8A4E9E"
  }
}
```

---

## 📋 Parámetros de Configuración

| Parámetro | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `username` | `string` | `$USER` | Nombre mostrado en la cabecera en reposo. Si se deja vacío, tomará tu usuario de sistema. |
| `userIcon` | `string` | `"󰣇"` | Icono a la izquierda del nombre. Soporta Nerd Fonts (`󰣇`, ``, `󰊤`, ``) o emojis/texto estándar (`✦`, `★`, `✨`, `""`). |
| `flowerIcon` | `string` | `"✿"` | Glifo de la flor. Si se establece `"✿"`, activará la rotación multiciclo (`✿ → ❀ → ❁ → ✾`) en estado de trabajo. |
| `showContextInIdle` | `boolean` | `true` | Muestra u oculta la cápsula `Ctx: X%` cuando el agente está en reposo. |
| `enableComet` | `boolean` | `true` | Activa o desactiva la animación del cometa de partículas. También controlable con la variable de entorno `GENTLE_PI_WORKING_COMET=0`. |
| `cometSpeedMs` | `number` | `80` | Intervalo de refresco en milisegundos para la animación del cometa. |
| `cometTrackWidth` | `number` | `22` | Ancho horizontal del riel por el que viaja el cometa. |
| `warningThreshold` | `number` | `70` | Porcentaje a partir del cual el medidor de contexto pasa a tonos ámbar/naranja. |
| `criticalThreshold`| `number` | `90` | Porcentaje a partir del cual se dispara la alarma automotriz parpadeante en Rojo Neón. |
| `resetThreshold` | `number` | `15` | Porcentaje al que debe descender el contexto para apagar la retención (*latching*) de alarma. |

---

## 🎨 Paleta de Colores (`theme`)

Puedes definir cualquier color en formato hexadecimal (`#RRGGBB` o `#RGB`):

* `borderColor`: Color de los marcos `╭`, `─`, `╮`, `│`, `╰`, `╯`.
* `userNameColor`: Color y realce del texto con tu nombre.
* `flowerColor`: Color base de la flor.
* `separatorColor`: Color de la barra vertical separadora `   │   ` en el modo de trabajo.

---

## 💡 Ejemplos de Personalización

### A. Estilo Cyberpunk / Neon
```json
{
  "username": "Neo",
  "userIcon": "⚡",
  "flowerIcon": "✦",
  "theme": {
    "borderColor": "#00E5FF",
    "userNameColor": "#FF2DF7",
    "flowerColor": "#00E5FF",
    "separatorColor": "#9B5CFF"
  }
}
```

### B. Estilo Terminal Minimalista (Sin Nerd Fonts)
```json
{
  "username": "Alex",
  "userIcon": "",
  "flowerIcon": "•",
  "theme": {
    "borderColor": "#888888",
    "userNameColor": "#EEEEEE",
    "flowerColor": "#AAAAAA",
    "separatorColor": "#555555"
  }
}
```

---

## 🛡️ Convivencia con Temas Principales

Si ya tienes instalado un tema global en Pi (como temas de terceros o paquetes de interfaz completos):
1. `scanner-working-chat` **no modificará** tu pie de página (footer) ni tus banners superiores (header).
2. Si tu tema actual incluía un editor de prompt simple, `scanner-working-chat` asumirá el control visual del marco del chat para brindarte la animación del cometa y el medidor de contexto en tiempo real.
3. Para instrucciones automatizadas destinadas a asistentes de IA, consulta [`AI_INSTALL.md`](./AI_INSTALL.md).

---

## 🤖 ¿Le pides a un Agente de IA que lo instale por ti? (Prompt Rápido)

Si tú, tu amigo o un cliente quieren que un agente de IA (Pi Coding Agent, Claude, Cursor, Copilot, etc.) haga la instalación automáticamente, solo deben copiar y pegar este prompt directo:

```text
Instala en mi Pi la extensión scanner-working-chat ejecutando:
curl -fsSL https://raw.githubusercontent.com/WiloxDev/scanner-working-chat/main/install.sh | bash
y avísame cuando termines para hacer /reload. No toques mi tema principal.
```

El instalador `install.sh` se encarga en segundo plano de:
1. Detectar si tu entorno es Gentle-Pi (`~/.pi/agent/extensions`) o Gentle-Shell (`~/.pi/agent-j0k3r/extensions`).
2. Descargar, compilar y preservar intacto tu tema principal (footers, headers y widgets del sidebar).
3. Generar tu archivo `~/.scanner-chatrc.json` con tu usuario actual.

---

## 🔄 Aplicar Cambios

Una vez guardado el archivo `~/.scanner-chatrc.json`, simplemente ejecuta dentro de tu sesión activa de Pi:
```text
/reload
```
Los nuevos ajustes se aplicarán de forma instantánea.
