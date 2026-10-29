## Workflow Status
- Status: READY
- Blockers: None

## Question & Scope
- Bounded local investigation: identify redraw, animation timing, lifecycle cleanup, status semantics, configuration precedence, editor ownership and test evidence needed to plan dynamic scanner status alongside themes. Repository revision: 80114c9086047d15b9a6fdf44be1af26b51f6fe8.
- Read scope: /home/wilox/projects/integraciones/scanner-working-chat and relevant installed Pi runtime/reference theme under /home/wilox/.pi/agent-wilox. Configuration and Git state remain unchanged; no screenshot reinvestigation or live service execution. Reused delegated wall-clock/pulse context and historical observation mem:2820 without treating its proposed timer as a proven fix.
- Sources/tools: targeted `rg`, numbered local source reads, Engram search, artifact-contract skill and global operating guide. No project-local skill directory was found at .pi/skills or .agents/skills; skill registry resolver was not available.

## Findings

### EVID-001: Host indicator actively drives redraw
- Source: /home/wilox/.pi/agent-wilox/pi-runtime/node_modules/@earendil-works/pi-tui/dist/components/loader.js:28-73; /home/wilox/.pi/agent-wilox/pi-runtime/node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1776-1793.
- Fact: Loader.setIndicator starts/restarts an interval when it has multiple frames; each interval updates the frame and calls updateDisplay, which calls ui.requestRender. Host passes the active indicator into an editor supporting embedded status, otherwise adds it to the status container.
- Relevance: An independent editor timer is not established as necessary; actual active runtime and redraw delivery still need verification.
- Confidence: HIGH

### EVID-002: Period truncation and unused speed configuration
- Source: src/shell-working-top-border.ts:62-70,123-135; src/shell-working-comet.ts:49-62; src/ScannerWorkingEditor.ts:23-45,165-170; src/config.ts:107,269,338 (all paths under repository root).
- Fact: Working render uses floor(timestamp/100) modulo 12, or zero in zen mode. Comet cycle is track width plus glyph count; flower and scan each define 15-phase effects. The externally supplied tick resets after 12 values, so phases 12–14 are unreachable and comet cycles longer than 12 are truncated. Indicator is configured for 12 frames at 100 ms; cometSpeedMs defaults to 80 and is loaded but has no source usage outside config.ts.
- Relevance: A 1.2-second forced repeat can interrupt effects; configurable speed currently does not drive comet rendering. Frame and wall-clock phases are distinct.
- Confidence: HIGH

### EVID-003: Cleanup and transition ownership
- Source: installed interactive-mode.js:1783-1805,1819-1827; installed components/status-indicator.js:18-20,38-41; installed pi-tui loader.js:32-36; src/ScannerWorkingEditor.ts:177-204; /home/wilox/.pi/agent-wilox/extensions/.disabled-wilox-working-scanner/index.ts:42-52,98-118.
- Fact: Host disposes replaced/cleared status indicators, stopping Loader timers; retry also disposes its countdown. Scanner resets its working start timestamp when an idle border is rendered and has no independent pulse in the inspected editor. The reference editor starts a pulse on working, stops it on idle or dispose, and requests renders.
- Relevance: Any additional timer needs explicit lifecycle and replacement cleanup evidence, rather than assuming host disposes custom editors.
- Confidence: HIGH

### EVID-004: Status is not synonymous with agent working
- Source: installed interactive-mode.js:1783-1793,2970-2983,3042-3075; installed components/status-indicator.js:22-58; src/ScannerWorkingEditor.ts:54-60,177-204; src/shell-working-top-border.ts:123-140.
- Fact: Host embeds working, retry, compaction and branch-summary indicators via the same status route. Scanner selects its working border by truthy renderInBorder output, not indicator kind; labels starting with working are normalized to working…, other stripped labels are retained with ellipsis as needed. Duration begins on first working-border render, and resets on idle render.
- Relevance: Status clarity and transitions must account for distinct host status kinds, not silently label every active indicator as agent work.
- Confidence: HIGH

### EVID-005: Configuration precedence and reload behavior
- Source: src/config.ts:228-273; src/index.ts:8-12,23-42,51-70; src/shell-working-top-border.ts:64-67.
- Fact: Config path selection is explicit option, then SCANNER_CHAT_CONFIG, then home default. Most displayed fields use overrides, parsed file, then terminal defaults; GENTLE_PI_WORKING_COMET precedes those for enableComet. Zen suppresses comet and freezes other effects. /scanner zen changes in-memory config; /scanner reload reloads config and updates editor border color. Enabled=false at initial activation prevents registration.
- Relevance: Preserve documented precedence and distinguish runtime override from persistent settings; no configuration mutation is authorized.
- Confidence: HIGH

### EVID-006: Editor ownership is exclusive in inspected host
- Source: installed interactive-mode.js:2242-2259,2291-2298; src/index.ts:51-70; /home/wilox/.pi/agent-wilox/extensions/wilox-theme/index.ts:919 and src/WiloxThemeEditor.ts:152-179.
- Fact: Both scanner and reference theme install a custom editor. Host setCustomEditorComponent replaces the current editor with the supplied factory's instance and copies text/callbacks and default border color; it does not compose the two editor implementations in this method. Reference theme embeds status, configures its indicator and reads currentFrame.
- Relevance: Coexistence depends on actual registration order/ownership and design contract; installed source alone does not prove which editor wins in a particular session. Host border color copy may override scanner constructor color.
- Confidence: HIGH

### EVID-007: Existing tests cover snapshots, not lifecycle
- Source: tests/editor.test.ts:46-135; tests/working-top-border.test.ts:39-288; tests/comet.test.ts:10-62; tests/config.test.ts:20-96.
- Fact: Tests cover idle/working rendering, narrow widths, empty status, zen, duration, comet width/glyph cycling and config defaults/overrides. The listed editor and border tests do not exercise host timer redraw, editor replacement, cleanup, full wall-clock wrap, speed changes or status-kind transitions. This investigation did not run tests; historical passing result is only reported in mem:2820.
- Relevance: Add deterministic timing and lifecycle/precedence coverage when a future plan defines acceptance.
- Confidence: HIGH

## Unknowns & Limits
- No live session examined: freeze cause, running runtime identity, actual installed extension order, theme ownership and screenshot identity remain unverified. Code behavior is not proof of live behavior.
- No claim that a second timer is required, or that theme editor composition is supported. Exact preferred coexistence strategy and visual timing/clarity acceptance should be established by the planning authority if not already specified by the user.
- No changes to configuration, code or Git state; no tests run. Relevant skill registry resolver unavailable, and project-local skill directories checked were absent.

## Recommended Next Action
Review these findings and develop the authorized plan, resolving any material timing, status semantics or competing-editor ownership decisions with the user before implementation.
