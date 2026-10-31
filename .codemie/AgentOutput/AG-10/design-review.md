# Design Review — AG-10: Filter transactions by type

## Review scope
**Jira issue:** AG-10 — “Filter transactions by type”  
**SDLC Stage:** 3 — Design Review  
**Objective:** Review Stage 2 architecture for completeness, consistency with requirements, risk, testability, and alignment with repository constraints.

## Artifacts reviewed
- `.codemie/AgentOutput/AG-10/requirements.md`: Available in this branch session (stored)
- `.codemie/AgentOutput/AG-10/architecture.md`: Available in this branch session (stored)
- Repository patterns: **Not Verified** (not inspected beyond high-level repository listing)

## Summary recommendation
**GO** to implementation planning **only if** the “Critical/High” items below are resolved/confirmed during Stage 4 planning.

## Review checklist
### Requirements coverage & traceability
- [x] AC1 options All/Income/Expenses covered
- [x] AC2 filtering behavior covered
- [x] AC3 All shows full history covered
- [x] AC4 empty state covered
- [~] Domain definition for Income vs Expense explicit (**needs confirmation**)

### UX & accessibility
- [~] Control type chosen per design system (**Not Verified**)
- [~] Keyboard/ARIA requirements noted, but must be implemented and tested

### Data/API
- [~] Client-side filtering assumed; server-side filtering flagged as contingency
- [~] Pagination considerations flagged but not confirmed

### Security & privacy
- [~] Authorization scoping mentioned; must be ensured if API filtering is added

### Testability
- [~] Filtering logic suitable for unit tests; needs explicit test cases

## Findings
### Critical
- **DR-C1:** Income vs Expense source-of-truth is TBD. Architecture must specify the canonical rule before implementation to avoid inconsistent filtering.

### High
- **DR-H1:** If transactions are paginated server-side, client-side filtering may only filter the current page. Planning must verify pagination behavior and choose correct approach.
- **DR-H2:** Unknown/other types and `amount=0` behavior is not defined. Must be decided to prevent confusing UX.

### Medium
- **DR-M1:** Persistence of filter across navigation is not defined; decide for consistent UX.
- **DR-M2:** Empty-state copy is TBD; should be defined or use standard app copy.
- **DR-M3:** Telemetry requirements unclear; decide whether to instrument.

### Low
- **DR-L1:** Consider whether filter state should be reflected in URL/query params (web) or deep-link state (mobile) if applicable.

## Required changes vs recommendations
### Required before implementation (blockers)
1. Decide and document the canonical transaction type classification rule (explicit field vs amount sign vs hybrid).
2. Decide behavior for `amount=0` and unknown/other types.
3. Confirm whether transaction history is paginated/server-driven; choose client-side vs server-side filtering accordingly.

### Recommendations
- Define filter persistence policy (reset vs persist).
- Define empty-state copy.
- Add analytics events if product uses telemetry.

## Traceability to acceptance criteria
- AC1 → Filter control with 3 options (Architecture: UI structure)
- AC2 → `visibleTransactions = filterTransactions(...)`
- AC3 → `filter=ALL` returns original list
- AC4 → `visibleTransactions.length === 0` shows EmptyState

## Open questions
- Exact transaction model fields present in codebase?
- How should transfers/refunds/adjustments be classified?
- Any localization/i18n requirements for filter labels and empty state?

