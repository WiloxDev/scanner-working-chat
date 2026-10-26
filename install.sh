#!/usr/bin/env bash
# ==============================================================================
# Scanner Working Chat - Auto-Instalador para Gentle-Pi y Gentle-Shell
# ==============================================================================
set -e

REPO_URL="https://github.com/WiloxDev/scanner-working-chat.git"
DEFAULT_EXT_DIR="$HOME/.pi/agent/extensions/scanner-working-chat"

echo "🌸 Instalando 'Scanner Working Chat' para Gentle-Pi / Gentle-Shell..."

# 1. Determinar el directorio de extensiones de Pi
# Detecta automáticamente Gentle-Shell / perfil j0k3r o Gentle-Pi estándar
if [ -d "$HOME/.pi/agent-j0k3r/extensions" ]; then
    TARGET_EXT_DIR="$HOME/.pi/agent-j0k3r/extensions/scanner-working-chat"
else
    TARGET_EXT_DIR="$DEFAULT_EXT_DIR"
fi

PI_EXT_BASE="$(dirname "$TARGET_EXT_DIR")"
mkdir -p "$PI_EXT_BASE"

# 2. Clonar o Actualizar el Repositorio
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$TARGET_EXT_DIR/.git" ]; then
    echo "🔄 Actualizando versión existente en $TARGET_EXT_DIR..."
    git -C "$TARGET_EXT_DIR" pull --ff-only
elif [ "$SCRIPT_DIR" != "$TARGET_EXT_DIR" ] && [ -f "$SCRIPT_DIR/package.json" ]; then
    echo "📦 Copiando extensión local a $TARGET_EXT_DIR..."
    rm -rf "$TARGET_EXT_DIR"
    cp -r "$SCRIPT_DIR" "$TARGET_EXT_DIR"
else
    echo "📥 Clonando extensión en $TARGET_EXT_DIR..."
    rm -rf "$TARGET_EXT_DIR"
    git clone "$REPO_URL" "$TARGET_EXT_DIR"
fi

# 3. Compilar TypeScript si npm está disponible
if command -v npm >/dev/null 2>&1; then
    echo "🔨 Compilando extensión..."
    cd "$TARGET_EXT_DIR"
    npm install --silent --no-audit --no-fund
    npm run build --silent
fi

# 4. Crear configuración por defecto si no existe
USER_CONFIG="$HOME/.scanner-chatrc.json"
CURRENT_USER="${USER:-$(whoami)}"

if [ ! -f "$USER_CONFIG" ]; then
    echo "⚙️  Creando archivo de configuración personal en $USER_CONFIG..."
    cat << EOF > "$USER_CONFIG"
{
  "username": "$CURRENT_USER",
  "userIcon": "󰣇",
  "flowerIcon": "✿",
  "showContextInIdle": true,
  "enableComet": true,
  "cometSpeedMs": 80,
  "cometTrackWidth": 22,
  "cometGlyphs": ["◆", "●", "•", "∙", "·"],
  "cometColors": ["#5CB8C7", "#4EA0B2", "#40879B", "#30697D", "#204B5F"],
  "warningThreshold": 70,
  "criticalThreshold": 90,
  "resetThreshold": 15,
  "spectrumColors": [
    "#4ADE80", "#84CC16", "#A3E635", "#EAB308",
    "#F59E0B", "#F97316", "#EF4444", "#DC2626"
  ],
  "theme": {
    "borderColor": "#5CB8C7",
    "userNameColor": "#7BC88F",
    "flowerColor": "#5CB8C7",
    "separatorColor": "#8A4E9E",
    "labelColor": "#5CB8C7",
    "emptyCellColor": "#465564",
    "neonRedPulseBase": "#781423",
    "neonRedPulsePeak": "#FF1E44"
  }
}
EOF
fi

echo ""
echo "✅ ¡Instalación completada con éxito!"
echo "📍 Ubicación: $TARGET_EXT_DIR"
echo "⚙️ Configuración: $USER_CONFIG (Totalmente personalizable)"
echo "✨ Al abrir tu próxima sesión de Gentle-Pi o ejecutar /reload, tu recuadro de chat cobrará vida."