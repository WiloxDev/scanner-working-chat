# 🤖 AI Agent Installation & Coexistence Protocol (`AI_INSTALL.md`)

> **Instrucciones para Agentes de IA (Pi Coding Agent, Claude, Cursor, Copilot, Windsurf):**  
> Si un usuario te pide instalar, configurar o solucionar problemas con `scanner-working-chat`, sigue estrictamente este protocolo determinista.

---

## 🎯 1. Detección del Entorno de Destino

No instales a ciegas. Determina en qué entorno reside la instalación activa de Pi en la máquina del usuario:

```bash
# 1. Verifica si existe un perfil personalizado (ej. Gentle-Shell / agent-j0k3r)
if [ -d "$HOME/.pi/agent-j0k3r/extensions" ]; then
    TARGET_DIR="$HOME/.pi/agent-j0k3r/extensions/scanner-working-chat"
# 2. Si no, usa el directorio estándar de Gentle-Pi
elif [ -d "$HOME/.pi/agent/extensions" ]; then
    TARGET_DIR="$HOME/.pi/agent/extensions/scanner-working-chat"
# 3. Fallback genérico para Pi Agent
else
    TARGET_DIR="$HOME/.pi/agent/extensions/scanner-working-chat"
fi
```

---

## 🛡️ 2. Prevención de Conflictos con el Tema Principal (Theme Coexistence)

### ¿Cómo opera este componente?
`scanner-working-chat` reemplaza **únicamente el recuadro del editor de texto** (`ctx.ui.setEditorComponent`).

* **Lo que NO toca (Compatibilidad Total):**
  * NO toca `ctx.ui.setFooter(...)` $\rightarrow$ Respeta el footer de Git, cuotas y modelos de cualquier tema.
  * NO toca `ctx.ui.setHeader(...)` $\rightarrow$ Respeta banners ASCII y cabeceras de bienvenida.
  * NO toca `ctx.ui.setWidget(...)` $\rightarrow$ Respeta Discord, Wellness o cualquier barra lateral.
  * NO altera herramientas ni modelos.

### Si el usuario ya tiene un tema con su propio CustomEditor (ej. `j0k3r-theme`):
1. **Regla de Carga de Pi:** Si ambos temas llaman a `ctx.ui.setEditorComponent`, la última extensión cargada tomará el control del editor.
2. **Recomendación para la IA:**
   * Si el usuario quiere `scanner-working-chat` como su editor definitivo, instala `scanner-working-chat` normalmente. Al ser una extensión dedicada, asumirá el control del marco del prompt.
   * Si el usuario tenía una versión legacy del scanner dentro de su tema anterior, asegúrate de que la configuración `enabled: true` en `~/.scanner-chatrc.json` esté activa.

---

## 🚀 3. Flujo Determinista de Instalación para la IA

Cuando el usuario te ordene instalarlo, ejecuta los siguientes pasos:

### Paso 1: Clonar o sincronizar repositorio
```bash
git clone https://github.com/WiloxDev/scanner-working-chat.git "$TARGET_DIR" 2>/dev/null || git -C "$TARGET_DIR" pull --ff-only
```

### Paso 2: Instalar dependencias y compilar
```bash
cd "$TARGET_DIR"
npm install --silent --no-audit --no-fund
npm run build --silent
```

### Paso 3: Inicializar configuración personal
Verifica si `$HOME/.scanner-chatrc.json` existe. Si no existe, créalo usando el nombre del usuario del sistema:
```bash
CURRENT_USER="${USER:-$(whoami)}"
cat << EOF > "$HOME/.scanner-chatrc.json"
{
  "username": "$CURRENT_USER",
  "userIcon": "󰣇",
  "flowerIcon": "✿",
  "showContextInIdle": true,
  "enableComet": true,
  "cometSpeedMs": 80,
  "contextAlertThreshold": 90,
  "theme": {
    "borderColor": "#5CB8C7",
    "userNameColor": "#7BC88F",
    "flowerColor": "#5CB8C7",
    "separatorColor": "#8A4E9E"
  }
}
EOF
```

### Paso 4: Validar con la suite TDD
Ejecuta la suite de pruebas para certificar que el entorno de terminal es compatible:
```bash
npm test
```
*(Todas las 14 pruebas deben reportar `pass`)*.

### Paso 5: Instrucción de Cierre
Indica al usuario que ejecute `/reload` en su sesión de Pi para disfrutar de la nueva interfaz interactiva.
