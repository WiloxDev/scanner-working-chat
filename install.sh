#!/usr/bin/env bash
# ==============================================================================
# Scanner Working Chat - Auto-Instalador para Gentle-Pi y Gentle-Shell
# ==============================================================================
set -e

REPO_URL="https://github.com/WiloxDev/scanner-working-chat.git"
DEFAULT_EXT_DIR="$HOME/.pi/agent/extensions/scanner-working-chat"

# Parse CLI arguments (e.g., ./install.sh --name "Wilox")
CHOSEN_USER="${SCANNER_USER:-}"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --name|-n)
            CHOSEN_USER="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

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

if [ "$SCRIPT_DIR" != "$TARGET_EXT_DIR" ] && [ -f "$SCRIPT_DIR/package.json" ]; then
    echo "📦 Copiando extensión local a $TARGET_EXT_DIR..."
    rm -rf "$TARGET_EXT_DIR"
    cp -r "$SCRIPT_DIR" "$TARGET_EXT_DIR"
elif [ -d "$TARGET_EXT_DIR/.git" ]; then
    echo "🔄 Actualizando versión existente en $TARGET_EXT_DIR..."
    git -C "$TARGET_EXT_DIR" pull --ff-only 2>/dev/null || true
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

# 4. Sincronizar Almacén Central Unificado POSIX (~/.config/wiloxdev/settings.json) y legacy (~/.scanner-chatrc.json)
UNIFIED_CONFIG_DIR="$HOME/.config/wiloxdev"
UNIFIED_CONFIG="$UNIFIED_CONFIG_DIR/settings.json"
LEGACY_CONFIG="$HOME/.scanner-chatrc.json"
CURRENT_MACHINE_NAME="$(hostname 2>/dev/null || cat /etc/hostname 2>/dev/null || echo "${USER:-user}")"

mkdir -p "$UNIFIED_CONFIG_DIR"

if [ -z "$CHOSEN_USER" ]; then
    echo ""
    echo "👤 Configuración de Identidad:"
    echo "   1) Por defecto: Nombre del equipo ('$CURRENT_MACHINE_NAME')"
    echo "   2) Personalizado: Elige tu propio alias (Ej: Wilox)"
    echo ""
    if [ -t 0 ]; then
        read -r -p "👉 ¿Qué nombre deseas mostrar en el badge? [Enter para '$CURRENT_MACHINE_NAME']: " INPUT_USER
        CHOSEN_USER="${INPUT_USER:-$CURRENT_MACHINE_NAME}"
    elif (exec </dev/tty) 2>/dev/null; then
        read -r -p "👉 ¿Qué nombre deseas mostrar en el badge? [Enter para '$CURRENT_MACHINE_NAME']: " INPUT_USER </dev/tty 2>/dev/null || true
        CHOSEN_USER="${INPUT_USER:-$CURRENT_MACHINE_NAME}"
    fi
fi
CHOSEN_USER="${CHOSEN_USER:-$CURRENT_MACHINE_NAME}"

# Crear o actualizar en el almacén unificado usando node de forma atómica POSIX
if command -v node >/dev/null 2>&1; then
    node -e "
    const fs = require('fs');
    const path = '$UNIFIED_CONFIG';
    const legacyPath = '$LEGACY_CONFIG';
    const chosen = '$CHOSEN_USER';
    
    let unified = {};
    if (fs.existsSync(path)) {
        try { unified = JSON.parse(fs.readFileSync(path, 'utf8')); } catch {}
    }
    unified.schema = unified.schema || 'wiloxdev.unified/v1';
    unified.ui = unified.ui || { lastExpandedModule: 'chat-scanner' };
    unified.sidebar = unified.sidebar || { width: 38, breakpoint: 115, gap: 2 };
    unified.scanner = {
        username: chosen,
        zenMode: false,
        showWorkingContext: true,
        showContextInIdle: true,
        showWorkingDuration: true,
        showCompactionCount: true,
        userIcon: '󰣇',
        flowerIcon: '✿',
        enableComet: true,
        cometSpeedMs: 45,
        cometTrackWidth: 10,
        ...(unified.scanner || {})
    };
    if (chosen && chosen !== '$CURRENT_MACHINE_NAME') {
        unified.scanner.username = chosen;
    }
    
    // Escritura atómica POSIX en settings.json
    const tmp = path + '.' + require('crypto').randomUUID() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(unified, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(tmp, path);

    // Sincronizar espejo legacy ~/.scanner-chatrc.json
    const tmpLegacy = legacyPath + '.' + require('crypto').randomUUID() + '.tmp';
    fs.writeFileSync(tmpLegacy, JSON.stringify(unified.scanner, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(tmpLegacy, legacyPath);
    " 2>/dev/null || true
fi

echo ""
echo "✅ ¡Instalación completada con éxito!"
echo "📍 Ubicación: $TARGET_EXT_DIR"
echo "👤 Badge configurado como: '󰣇 $CHOSEN_USER ✿'"
echo "⚙️  Almacén Unificado: $UNIFIED_CONFIG"
echo ""
echo "✨ Control Visual y Personalización Nativa:"
echo "   Abre en tu chat: /gentle:customize  ➔  Community  ➔  WiloxDev"
echo "   Allí podrás ajustar badge, cometa, context gauge o zen mode interactivamente."
echo "   • /scanner reload         - Recargar ~/.scanner-chatrc.json sin reiniciar Pi"
echo ""
echo "✨ Al abrir tu próxima sesión de Gentle-Pi o ejecutar /reload, tu recuadro de chat cobrará vida."