# 🔬 Auditoría Quirúrgica: `scanner-working-chat` vs Gentle-Shell/Gentle-Pi

**Fecha:** 2026-10-25  
**Versión analizada:** 1.0.0  
**Dependencias objetivo:** `@earendil-works/pi-coding-agent@^0.87.1`, `@earendil-works/pi-tui@^0.87.1`  
**Alcance:** Solo lectura — Análisis de viabilidad, robustez, compatibilidad hacia adelante y deuda técnica.

---

## 📋 Resumen Ejecutivo

| Categoría | Estado | Riesgo |
|-----------|--------|--------|
| **Compatibilidad API** | ✅ Compatible con 0.87.1 | Bajo |
| **Aislamiento de efectos** | ✅ Bien encapsulado | Bajo |
| **Manejo de errores** | ⚠️ Parcial (try/catch solo en activate) | Medio |
| **Configuración resiliente** | ✅ Defaults seguros + overrides | Bajo |
| **Deuda visual hardcodeada** | ⚠️ Colores, glifos, anchos fijos | Medio |
| **Acoplamiento a internals** | ⚠️ Acceso a `workingStatusIndicator` privado | **Alto** |
| **Tests TDD** | ✅ 14/14 passing | Bajo |

**Veredicto:** **Viable para producción** con **una corrección crítica** (acceso a propiedad privada) y **tres mejoras recomendadas** para blindar contra versiones futuras.

---

## 🎯 1. Superficie de API Utilizada (Contrato con Pi)

### 1.1 ExtensionAPI — `pi.on("session_start", ...)`
```typescript
pi.on("session_start", (_event, ctx) => { ... })
```
- **Estabilidad:** **ALTA**. Evento fundacional, improbable que cambie firma.
- **Uso correcto:** ✅ Guarda `ctx` para `getContextUsage()` y `ctx.ui.setEditorComponent()`.

### 1.2 ExtensionUIContext — `ctx.ui.setEditorComponent(factory)`
```typescript
ctx.ui.setEditorComponent((tui, theme, keybindings) => new ScannerWorkingEditor(...))
```
- **Estabilidad:** **ALTA**. Punto de extensión oficial para editores custom.
- **Uso correcto:** ✅ Recibe `(tui, theme, keybindings)` y devuelve `CustomEditor`.

### 1.3 ExtensionUIContext — `ctx.ui.setWorkingIndicator(options)` (Opcional)
```typescript
if (typeof (ctx.ui as any)?.setWorkingIndicator === "function") {
  (ctx.ui as any).setWorkingIndicator(ARCH_WORKING_INDICATOR);
}
```
- **Estabilidad:** **MEDIA**. API documentada en `WorkingIndicatorOptions` pero el casteo `(ctx.ui as any)` sugiere que no está en los tipos públicos exportados o es reciente.
- **Riesgo:** Si Pi cambia la firma o elimina el método, el `try/catch` lo absorbe silenciosamente.

### 1.4 ExtensionContext — `ctx.getContextUsage()`
```typescript
const usage = this.ctx.getContextUsage();
const percent = usage?.percent ?? null;
```
- **Estabilidad:** **ALTA**. Método público documentado en `ExtensionContext`.

### 1.5 pi-tui — Utilidades de render
```typescript
import { stripTerminalSequences, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
```
- **Estabilidad:** **ALTA**. Utilidades puras, sin efectos colaterales.

### 1.6 CustomEditor (Base Class)
```typescript
extends CustomEditor // de @earendil-works/pi-coding-agent
```
- **Estabilidad:** **MEDIA-ALTA**. Clase base diseñada para herencia.
- **Métodos override usados:**
  - `renderTopBorder(width, hiddenLineCount)` — **Punto crítico**
  - `render(width)` — Wrapper de bordes laterales/inferiores
  - `setWorkingStatusIndicator(indicator)` — Override para inyectar frames custom

---

## ⚠️ 2. Hallazgos Críticos (Acción Requerida)

### 🔴 CRÍTICO #1: Acceso a Propiedad Privada `workingStatusIndicator`

**Archivo:** `src/ScannerWorkingEditor.ts` líneas 181, 213, 232, 235, 243, 251

```typescript
const wsi = (this as any).workingStatusIndicator;  // ← ACCESO PRIVADO
```

**Problema:** `workingStatusIndicator` es **propiedad privada** de `CustomEditor` (no exportada en tipos, prefijo `_` en implementación real). TypeScript lo permite con `(this as any)` pero **rompe encapsulamiento**.

**Riesgo de versión:** Si Pi 0.88+ renombra, elimina o cambia la estructura interna del indicador de trabajo, la extensión **fallará en runtime** (undefined, error de tipo, o render corrupto).

**Evidencia en tipos públicos (`custom-editor.d.ts`):**
```typescript
export declare class CustomEditor extends Editor {
    private workingStatusIndicator;  // ← PRIVATE
    // ...
    setWorkingStatusIndicator(indicator: StatusIndicator | undefined): void;
}
```

**Solución quirúrgica (Recomendada):**
1. **Eliminar todo acceso directo a `workingStatusIndicator`**.
2. **Usar exclusivamente `setWorkingStatusIndicator()`** (método público diseñado para esto).
3. **Mover la lógica de frame/cometa/flor al override de `renderTopBorder`** leyendo solo `this.embedWorkingStatus` y `this.currentFrame` si fueran públicos, o calcular el tick internamente.

```typescript
// EN LUGAR DE:
const wsi = (this as any).workingStatusIndicator;
const rawStatus = wsi.renderInBorder?.(...);
const tick = wsi.currentFrame ?? 0;

// HACER:
protected override renderTopBorder(width: number, hiddenLineCount: number): string {
  // Calcular tick propio basado en Date.now() / intervalMs
  const tick = Math.floor(Date.now() / 100) % 12; // 100ms = intervalMs de ARCH_WORKING_INDICATOR
  // Renderizar comet/flor/status usando SOLO this.config y tick local
  // NO tocar workingStatusIndicator
}
```

**Por qué esto blinda:** El contrato público es `setWorkingStatusIndicator(frames, intervalMs)`. Mientras Pi respete ese contrato, tu editor funciona. El renderizado del borde es **tu responsabilidad completa** en `renderTopBorder`.

---

### 🟠 ALTO #2: Doble Inyección de Working Indicator (Conflicto de Propiedad)

**Archivo:** `src/index.ts` línea 16-18 Y `src/ScannerWorkingEditor.ts` línea 181-190

```typescript
// index.ts - En activate():
if (typeof (ctx.ui as any)?.setWorkingIndicator === "function") {
  (ctx.ui as any).setWorkingIndicator(ARCH_WORKING_INDICATOR);
}

// ScannerWorkingEditor.ts - En setWorkingStatusIndicator override:
override setWorkingStatusIndicator(indicator: any): void {
  if (indicator && typeof indicator.setIndicator === "function") {
    indicator.setIndicator({
      frames: createWorkingFrames(this.config.userIcon, 12),
      intervalMs: 100,
    });
    indicator._hasArchIndicator = true;
  }
  super.setWorkingStatusIndicator(indicator);
}
```

**Problema:** Dos caminos luchan por controlar el mismo indicador:
1. `index.ts` intenta setear `ARCH_WORKING_INDICATOR` (frames con icono `󰣇`) a nivel global via `ctx.ui.setWorkingIndicator()`.
2. `ScannerWorkingEditor.setWorkingStatusIndicator()` **sobrescribe** ese indicador con frames basados en `this.config.userIcon` (configurable por usuario).

**Resultado:** Ganador impredecible según orden de inicialización. Si el usuario configura `userIcon: "⚡"`, ve `⚡` en el indicador global PERO el editor puede mostrar `󰣇` o viceversa.

**Solución:** **Eliminar la llamada en `index.ts`** (líneas 16-18). El override en `ScannerWorkingEditor` ya inyecta los frames correctos basados en config de usuario. Es el lugar canónico.

---

## 🟡 3. Hallazgos de Riesgo Medio (Mejoras Recomendadas)

### MEDIO #1: Hardcoding Visual en `shell-working-comet.ts` y `shell-prompt-context-mirror.ts`

**Problema:** Colores, glifos, anchos y umbrales **hardcodeados** en módulos "puros" que deberían ser configurables.

**Ejemplos:**
```typescript
// shell-working-comet.ts
export const COMET_GLYPHS = ["◆", "●", "•", "∙", "·"] as const;
export const COMET_COLORS: readonly Rgb[] = [
  [92, 184, 199], [78, 160, 178], [64, 135, 155], [48, 105, 125], [32, 75, 95]
];
export const DEFAULT_COMET_TRACK_WIDTH = 10;
export const DEFAULT_COMET_FRAME_MS = 70;

// shell-prompt-context-mirror.ts
export const SPECTRUM_CELL_COLORS = [ ... 8 colores fijos ... ];
export const EMPTY_CELL_COLOR: readonly [number, number, number] = [70, 85, 100];
export const DEFAULT_CONTEXT_CRITICAL_THRESHOLD = 90;
```

**Riesgo:** Usuario no puede personalizar sin forkar. Si Pi cambia tema por defecto (ej. modo high-contrast), la extensión se ve desentonada.

**Solución:** Exponer opciones en `ScannerChatConfig` y pasar `config.cometGlyphs`, `config.cometColors`, `config.spectrumColors`, etc. a las funciones de render. Mantener defaults idénticos para cero breaking change.

---

### MEDIO #2: `renderTopBorder` — Complejidad Ciclomática Alta (≈ 120 líneas, 7+ ramas)

**Archivo:** `src/ScannerWorkingEditor.ts` líneas 175-280

**Problemas:**
- Múltiples responsabilidades: IDLE badge, WORKING status, comet, flor, context gauge, overflow label, degeneración elástica.
- Lógica de layout mezclada con lógica de color/animación.
- Difícil de testear unitariamente (tests actuales solo verifican output final).

**Riesgo:** Cambios futuros en `CustomEditor` (ej. nuevo parámetro en `renderTopBorder`) requieren refactor riesgoso.

**Solución:** Extraer **funciones puras** por responsabilidad:
```typescript
// En shell-idle-badge.ts
export function renderIdleTopBorder(config, ctx, width, hiddenLineCount): string

// En shell-working-top-border.ts
export function renderWorkingTopBorder(config, ctx, tick, rawStatus, width, hiddenLineCount): string

// En shell-comet.ts (ya existe renderWorkingComet)
// En shell-prompt-context-mirror.ts (ya existe renderPromptContextMirror)
```

`renderTopBorder` del editor se reduce a **delegar** a la función pura correspondiente. Esto:
- Aísla cambios de Pi en el editor base.
- Permite tests unitarios granulares por modo (IDLE vs WORKING).
- Facilita degeneración elástica como policy separada.

---

### MEDIO #3: Config `warningThreshold` No Utilizada

**Archivo:** `src/config.ts` línea 34 y `src/ScannerWorkingEditor.ts`

```typescript
// config.ts
warningThreshold: 70,  // ← DEFINIDO

// ScannerWorkingEditor.ts
// NUNCA SE USA warningThreshold
// Solo se usa criticalThreshold (90) y resetThreshold (15)
```

**Problema:** Configuración muerta. Confunde al usuario (ve `warningThreshold` en docs/MANUAL.md pero no hace nada).

**Solución:** 
- **Opción A:** Eliminar `warningThreshold` de config, types, docs, defaults.
- **Opción B:** Usarlo en `shell-prompt-context-mirror.ts` para cambiar color de gauge a ámbar/naranja entre 70-89% (actualmente salta de lima a rojo en 76%). **Preferida** por coherencia visual con `wer3.png`.

---

### MEDIO #4: Dependencia de `ctx.ui.theme` para `bold` (Frágil)

**Archivo:** `src/ScannerWorkingEditor.ts` línea 231

```typescript
const tier: ContextMirrorTier = ...;
const bold = (text) => (this.ctx?.ui?.theme as any)?.bold?.(text) ?? text;
```

**Problema:** Casteo `(as any)` a `theme` que no está tipado en `ExtensionUIContext`. Si Pi cambia `theme` a `themeManager` o elimina `bold`, falla silenciosamente (fallback a `text`).

**Solución:** Recibir `bold` function via config o crear helper local:
```typescript
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`; // ANSI estándar
// O usar this.config.boldFunction si se expone en config
```

---

## 🟢 4. Hallazgos de Bajo Riesgo / Buenas Prácticas Confirmadas

| Práctica | Estado | Evidencia |
|----------|--------|-----------|
| **Defaults seguros** | ✅ | `loadConfig()` retorna `DEFAULT_CONFIG` si archivo falta/corrupto |
| **Validación de hex** | ✅ | `hexToRgb()` con fallback, soporta `#RGB` y `#RRGGBB` |
| **Env var override** | ✅ | `GENTLE_PI_WORKING_COMET=0` desactiva comet globalmente |
| **NO_COLOR support** | ✅ | `process.env.NO_COLOR` respetado en `ansiRgb()` |
| **Visible width invariants** | ✅ | Tests verifican `visibleWidth(rendered) === trackWidth` |
| **Elastic degeneration** | ✅ | Test `narrowWidth: 25` pasa; badge se recorta graceful |
| **Latching alarm logic** | ✅ | Test cubre histéresis 90%→15% correctamente |
| **TypeScript strict** | ✅ | `tsconfig.json` con `strict: true`, cero `any` en código propio (excepto 2 castings necesarios) |
| **Theme coexistence** | ✅ | Solo toca `setEditorComponent`; respeta header/footer/widget |

---

## 🔮 5. Matriz de Compatibilidad Hacia Adelante (Versionamento Pi)

| Cambio en Pi | Impacto en `scanner-working-chat` | Mitigación Actual | Acción Requerida |
|--------------|-----------------------------------|-------------------|------------------|
| `CustomEditor` añade parámetro a `renderTopBorder` | **Roto** (signature mismatch) | Ninguna | Refactor a funciones puras (MEDIO #2) |
| `workingStatusIndicator` renombrado/eliminado | **Roto** (runtime error) | Ninguna | **CRÍTICO #1 - Eliminar acceso privado** |
| `ctx.ui.setWorkingIndicator` eliminado | Silencioso (try/catch) | try/catch en index.ts | Eliminar llamada redundante (ALTO #2) |
| `ctx.getContextUsage()` cambia firma | **Roto** (TypeScript error) | Types detectan en compile | Monitorear changelog Pi |
| `ExtensionContext` pierde `ui` | **Roto** | Types detectan | Poco probable (core API) |
| `visibleWidth`/`truncateToWidth` movidos | Build error | Types detectan | Import path update trivial |
| Nuevo modo `headless` (sin TUI) | Degradación graceful | `ctx.hasUI` guard en index.ts | ✅ Ya manejado |
| Tema high-contrast nativo | Visual clash | Colores hardcoded | MEDIO #1 - Configurable colors |

---

## 🛠️ 6. Plan de Acción Priorizado (Orden Quirúrgico)

### Fase 1: Crítico (Bloqueante para producción robusta)
| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 1 | Eliminar acceso a `workingStatusIndicator` privado; usar tick local en `renderTopBorder` | `ScannerWorkingEditor.ts` | ~30 min |
| 2 | Eliminar `ctx.ui.setWorkingIndicator(ARCH_WORKING_INDICATOR)` en `index.ts` | `index.ts` | ~2 min |

### Fase 2: Robustez Visual (Antes de v1.1)
| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 3 | Exponer `cometGlyphs`, `cometColors`, `cometTrackWidth`, `spectrumColors` en `ScannerChatConfig` | `config.ts`, `shell-working-comet.ts`, `shell-prompt-context-mirror.ts`, `ScannerWorkingEditor.ts` | ~45 min |
| 4 | Usar `warningThreshold` en gauge (ámbar 70-89%) | `shell-prompt-context-mirror.ts` | ~15 min |
| 5 | Reemplazar `(ctx.ui.theme as any)?.bold` con ANSI bold local | `ScannerWorkingEditor.ts` | ~5 min |

### Fase 3: Arquitectura Limpia (v1.2+)
| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 6 | Extraer `renderIdleTopBorder` y `renderWorkingTopBorder` como funciones puras | Nuevo `shell-idle-badge.ts`, `shell-working-top-border.ts`, refactor `ScannerWorkingEditor.ts` | ~60 min |
| 7 | Añadir tests unitarios para funciones puras extraídas | `tests/*.test.ts` | ~30 min |

---

## ✅ 7. Checklist de Validación Post-Correcciones

```bash
# 1. TypeCheck estricto
npm run typecheck

# 2. Suite TDD completa (14 tests)
npm test

# 3. Build limpio
npm run build

# 4. Verificar dist/ genera .d.ts correctos
ls dist/*.d.ts

# 5. Test manual en terminal estrecha (40 cols)
#    - npm run build
#    - Ejecutar en Pi: /reload
#    - Redimensionar terminal < 40 cols
#    - Verificar: sin overflow, bordes cerrados, badge legible

# 6. Test manual contexto crítico (>90%)
#    - Forzar context usage alto (mock o sesión real)
#    - Verificar: alarma parpadea rojo neón, latching hasta <15%

# 7. Test convivencia con tema j0k3r
#    - Instalar tema externo + scanner-working-chat
#    - Verificar: footer/git/header intactos, solo editor customizado
```

---

## 📎 8. Apéndice: Superficie de Tipos TypeScript Exportados

Para consumidores de la extensión (poco probable, pero para completitud):

```typescript
// index.ts - Default export
export default function activate(pi: ExtensionAPI): void

// config.ts
export interface ScannerChatConfig { ... }
export interface ScannerChatThemeColors { ... }
export const DEFAULT_CONFIG: ScannerChatConfig
export function loadConfig(options?: LoadConfigOptions): ScannerChatConfig
export function hexToRgb(hex: string, fallback: Rgb): Rgb

// shell-gauge.ts
export const GAUGE_CELLS = 8
export const GAUGE_FILLED = "▰"
export const GAUGE_EMPTY = "▱"
export function renderGauge(filled: number, total?: number, fillChar?: string, emptyChar?: string): string

// shell-working-comet.ts
export const COMET_GLYPHS, COMET_COLORS, DEFAULT_COMET_TRACK_WIDTH, DEFAULT_COMET_FRAME_MS
export interface WorkingCometRenderOptions { tick, width?, color? }
export function renderWorkingComet(opts: WorkingCometRenderOptions): string
export function isWorkingCometEnabled(): boolean

// shell-prompt-context-mirror.ts
export type ContextMirrorTier = "full" | "short" | "percentOnly"
export interface PromptContextMirrorOptions { ... }
export function evaluateContextAlertState(current, prev, critical?, reset?): boolean
export function renderPromptContextMirror(opts: PromptContextMirrorOptions): string
export function formatIdleContextBadge(percent, criticalThreshold?): string

// ScannerWorkingEditor.ts
export class ScannerWorkingEditor extends CustomEditor { ... }
export const ARCH_WORKING_INDICATOR: { frames: string[], intervalMs: number }
export function renderSyncFlower(tick, baseFlower?, baseColor?): string
export function scanWorkingText(text, tick): string
export function cleanStatusLabel(raw: string): string
```

---

## 🏁 Conclusión

**La extensión es funcional, bien testeada y compatible con Pi 0.87.1 hoy.**

**Para producción robusta y a prueba de versiones futuras:**
1. **Corregir CRÍTICO #1** (acceso privado) — **Obligatorio**.
2. **Eliminar ALTO #2** (doble inyección) — **Obligatorio**.
3. Aplicar MEDIO #1-4 antes de v1.1 para experiencia de usuario configurable.
4. Refactor Fase 3 cuando Pi anuncie cambios en `CustomEditor` o por proactividad técnica.

Con estas correcciones, `scanner-working-chat` cumple el principio de **mínima invasión**, **máxima configurabilidad** y **compatibilidad hacia adelante** que define una extensión Pi de primera clase.