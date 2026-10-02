# 🌸 Scanner Working Chat (`scanner-working-chat`)

> **Dynamic Kinetic Prompt & Real-Time Context Engine para Gentle-Pi y Gentle-Shell.**  
> Transforma el recuadro estático del editor de chat de Pi en una interfaz viva con animación cinemática de cometa, flor sincronizada y medidor espectral de contexto en tiempo real.

---

## 🎨 Vistas de Terminal

### 1. En Reposo (`IDLE` — Esperando entrada del usuario)
El marco superior muestra tu identidad personalizada, la flor insignia y el consumo actual de la ventana de contexto en texto limpio:

```text
╭─ 󰣇 Wilox ✿  󰣇 Ctx: 18% ────────────────────────────────────────────────────────╮
│ Escribe tu mensaje para el agente...                                            │
│                                                                                 │
╰─────────────────────────────────────────────────────────────────────────────────╯
```

### 2. Trabajando (`WORKING` — Agente pensando o ejecutando herramientas)
Al enviar un mensaje, el badge estático conmuta instantáneamente al centro de telemetría cinético:

```text
╭─ ◆●•∙··  ✿  working…   │   Context ▰▰▰▰▰▱▱▱ 62% ───────────────────────────────╮
│                                                                                 │
│  [ El agente está ejecutando herramientas o razonando en segundo plano ]        │
│                                                                                 │
╰─────────────────────────────────────────────────────────────────────────────────╯
```

---

## ✨ Características Principales

* 🌠 **Cometa Cinético de Partículas:** Animación en bucle fluido de 70ms con partículas `◆●•∙··` que recorre el marco mientras el agente trabaja.
* 🌸 **Flor Giratoria Sincronizada:** La flor rota (`✿ → ❀ → ❁ → ✾`) y late en cian brillante al compás de cada ciclo del cometa.
* ⚡ **Efecto Escáner en el Texto:** Onda reflectiva que viaja letra por letra a través de la palabra `working…` o de la herramienta en ejecución.
* 📊 **Medidor Espectral de Contexto (`wer3.png`):** Barra de 8 celdas graduadas con degradado suave térmico (Verde $\rightarrow$ Lima $\rightarrow$ Amarillo $\rightarrow$ Naranja $\rightarrow$ Rojo).
* 🚨 **Alarma Automotriz con Retención ($\ge 90\%$):** Oscilación senoidal en Rojo Neón Vivo (`#FF1E44`) con retención ininterrumpida (*latching*) hasta que el contexto baja del 15%.
* ⚙️ **100% Configurable:** Nombre, iconos, glifos y colores personalizables desde `~/.scanner-chatrc.json`.
* 🛡️ **Degeneración Elástica:** Si reduces el ancho de tu terminal, el marco se adapta automáticamente sin desbordar ni romperse.

---

## 🚀 Instalación Rápida

### Opción 1: Auto-Instalador en 1 Línea (Recomendada)
Ejecuta en tu terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/WiloxDev/scanner-working-chat/main/install.sh | bash
```

### Opción 2: Clonando el Repositorio
```bash
git clone https://github.com/WiloxDev/scanner-working-chat.git
cd scanner-working-chat
chmod +x install.sh
./install.sh
```

Al terminar, abre una nueva sesión de Gentle-Pi o escribe dentro del chat:
```text
/reload
```

---

## 📂 Dónde se Instala en el Sistema

* **Código de la Extensión:** 
  * `~/.pi/agent/extensions/scanner-working-chat/` (Gentle-Pi estándar)
  * `~/.pi/agent-j0k3r/extensions/scanner-working-chat/` (Gentle-Shell / Perfil j0k3r)
* **Archivo de Configuración Personal:**
  * `~/.scanner-chatrc.json` (independiente del código, no se borra al actualizar).

---

## 🧪 Pruebas Unitarias (TDD)

El proyecto cuenta con una suite completa de pruebas unitarias cubriendo cometa, medidores de contexto, configuración y render del editor:

```bash
npm install
npm test
npm run typecheck
```

---

## 🤖 Prompt Rápido para que una IA lo Instale

Si le pides a cualquier agente de IA (Pi Coding Agent, Claude, Cursor, Copilot, etc.) que haga la instalación por ti, solo cópiale este mensaje:

```text
Instala en mi Pi la extensión scanner-working-chat ejecutando:
curl -fsSL https://raw.githubusercontent.com/WiloxDev/scanner-working-chat/main/install.sh | bash
y avísame cuando termines para hacer /reload. No toques mi tema principal.
```

*(Para detalles técnicos del protocolo de IA, consulta [`AI_INSTALL.md`](./AI_INSTALL.md)).*

---

## 🛡️ Convivencia con tu Tema Principal (Theme Coexistence)

`scanner-working-chat` está diseñado siguiendo el principio de mínima invasión:
* **Solo controla el recuadro del chat:** Intercepta únicamente el hook `ctx.ui.setEditorComponent(...)`.
* **Cero interferencia:** Deja intactos los banners de bienvenida (`setHeader`), los footers con Git y cuotas (`setFooter`) y las barras laterales (`setWidget`).
* Puedes combinarlo libremente con cualquier tema de fondo o personalización previa.

---

## 📄 Licencia

MIT © [WiloxDev](https://github.com/WiloxDev)
