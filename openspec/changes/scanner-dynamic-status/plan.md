## Workflow Status
- Status: READY
- Blockers: None

## Goal
Restore dynamic scanner status with clear idle and active presentation, using elapsed-time animation and preserving the documented limitation that editor ownership depends on extension load order when the scanner and theme both register custom editors.

## Scope & Exclusions
The approved work area is /home/wilox/projects/integraciones/scanner-working-chat. Continue animation and status work without interception, runtime modification, theme modification, user configuration changes, dependency changes, Git operations, unrelated cleanup, or speculative architecture. The scanner may coexist with the theme only according to the host's existing editor replacement behavior; do not promise automatic replacement detection or runtime notification. Document the load-order-dependent ownership warning and live-session limitation.

## Execution Scope
- Root: /home/wilox/projects/integraciones/scanner-working-chat
- Allowed Paths:
  - /home/wilox/projects/integraciones/scanner-working-chat/**
  - /home/wilox/.pi/agent-wilox/pi-runtime/**
  - /home/wilox/.pi/agent-wilox/extensions/wilox-theme/**
- Writable Paths:
  - /home/wilox/projects/integraciones/scanner-working-chat/**
- Allowed Bash:
  - npm test
  - npm run build
- Notes: Implementation may modify only the project work area. Installed runtime and theme are read-only. Do not modify user configuration or Git state. Do not add interception, runtime/theme changes, dependencies, migrations, or compatibility bridges. Required workflow artifacts and assigned skills are separately authorized inputs and outputs. Apply remains authorized only after this READY plan is summarized and approved.

## MINI-001: Reproduce host redraw and ownership
- Contract: Inspect the relevant existing tests and host integration; reproduce the observed status/redraw behavior and establish how editor ownership and redraw currently work. Distinguish installed-source evidence from live-session evidence, and do not presume a second timer is needed.
- Acceptance: Record runtime and ownership evidence, a reproducible baseline, and the smallest suitable failing behavior for the supported test layer. If live ownership cannot be confirmed, record that limitation rather than treating source inspection or mocks as live proof.
- Canonical sources: discovery.md EVID-001, EVID-003, EVID-006, EVID-007.
- Validation: Run the narrowest useful existing baseline and focused reproduction, recording exact commands and outcomes. Separate observed runtime behavior, simulated behavior, and unavailable live confirmation.
- Depends on: None.

## MINI-002: Independent elapsed-time animation
- Contract: Make animation phases derive from elapsed time with independent effect cycles and configured comet speed. Add an independent render timer only if MINI-001 demonstrates it is necessary; if added, establish cleanup on idle, replacement, and disposal using supported host lifecycle behavior.
- Acceptance: Effects are not truncated by the current 12-frame reset; longer comet tracks and all flower/scan phases can progress through their own cycles. Changing configured speed changes comet timing. Any added timer has evidenced need and verified lifecycle cleanup; no timer is introduced speculatively.
- Canonical sources: discovery.md EVID-001 through EVID-003, EVID-005, EVID-007.
- Validation: Deterministic elapsed-time regression tests cover full cycles, wrap, speed, and, if applicable, timer redraw and cleanup. Use the established test layer and record RED, GREEN, and refactor results.
- Depends on: MINI-001.

## MINI-003: Status presentation and transitions
- Contract: Distinguish idle identity from active statuses without inferring tool identity. Preserve meaningful host status labels and account for working, retry, compaction, and branch-summary routes. Provide an approximately 200 ms transition while supporting narrow widths and zen behavior.
- Acceptance: Idle and active states are distinguishable; different active status labels are not all misrepresented as agent work or a presumed tool. The transition is exercised around its approximately 200 ms duration, and output remains valid at narrow widths and in zen mode.
- Canonical sources: discovery.md EVID-002, EVID-004, EVID-005, EVID-007.
- Validation: Deterministic tests cover idle-to-active and active-to-idle transitions, representative distinct host statuses, timing boundaries, narrow widths, and zen. Record RED, GREEN, and refactor results.
- Depends on: MINI-001, MINI-002.

## MINI-004: Configuration and load-order ownership documentation
- Contract: Preserve the established configuration precedence and reload/override behavior without changing user configuration. Document that scanner/theme editor ownership is load-order-dependent because the observed host API replaces the current custom editor rather than composing editors. Preserve the theme header/footer where the host registration order allows it, and do not add interception or automatic replacement detection.
- Acceptance: Tests exercise configuration source precedence and runtime reload/override behavior without writing user configuration. Ownership/coexistence coverage documents the relevant registration orders and verifies supported project behavior without claiming universal scanner priority. The plan and implementation documentation clearly warn that a later editor registration can replace the scanner, that no automatic replacement notification is provided, and that live-session ownership remains a limitation unless directly observed. Theme header/footer preservation is verified only for supported registration paths; no installed runtime or theme file is modified.
- Canonical sources: discovery.md EVID-005, EVID-006, EVID-007.
- Validation: Run focused configuration and ownership/coexistence tests at the closest existing boundary, distinguishing simulated integration from live confirmation. Verify the documented warning and confirm no interception, runtime/theme modification, or configuration mutation was introduced.
- Depends on: MINI-001.

## MINI-005: Regression and independent verification
- Contract: Reuse the established test framework and closest owning tests, keeping the change minimal and recording pre-existing failures separately. Independently verify every MINI against this plan and the discovery evidence.
- Acceptance: Focused regressions, npm test, and npm run build pass. Independent verification covers animation cycles, status transitions, configuration behavior, documented load-order ownership, scope exclusions, and live-testing limitations. Any unavailable required validation or unresolved failure blocks completion.
- Canonical sources: discovery.md EVID-007; assigned tdd and anti-overengineering skills.
- Validation: Record exact focused commands and results, npm test and npm run build outcomes, changed-file scope, and independent verification evidence.
- Depends on: MINI-001, MINI-002, MINI-003, MINI-004.

## Risks & Constraints
- The actual freeze cause, running runtime, and session registration order remain unverified (discovery.md EVID-001, EVID-006); reproduction and verification must not overstate installed-source or mock evidence.
- Host editor replacement is not composition (discovery.md EVID-006). Ownership can depend on load order; this is an accepted documented limitation, not a requirement for automatic detection or replacement notification.
- Do not add a timer, dependency, abstraction, migration, interception mechanism, or runtime/theme modification without demonstrated need and explicit authorization.
- Do not change user configuration or Git state. Live testing may be unavailable; report its limits clearly.

## Open Decisions
- None. The user-approved ownership decision is to accept and document load-order-dependent editor ownership and its live limitation instead of implementing automatic replacement detection.

## Next Permitted Action
Provide the READY plan summary for the apply authorization gate; after explicit approval, apply the approved MINI items within this execution scope.
