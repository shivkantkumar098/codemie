# Implementation Plan — AG-10: Filter transactions by type

## 1. Context

- **Jira issue:** AG-10 — “Filter transactions by type”
- **Requirements source:** `.codemie/AgentOutput/AG-10/requirements.md`
- **Architecture source:** `.codemie/AgentOutput/AG-10/architecture.md`
- **Design review source:** `.codemie/AgentOutput/AG-10/design-review.md`
- **Repo / branch inspected:** https://github.com/shivkantkumar098/codemie (`feature/AG-10`)

### Actual stack (from repo inspection)
- **Vanilla JS web app** (no framework)
- Single-page static assets: `index.html`, `script.js`, `styles.css`
- Persistence: `window.localStorage` (via `transactionRepository`)
- Tests: **Node’s built-in test runner** in `tests/app.test.cjs` using a `FakeElement` DOM harness + `vm.runInContext`

### What “type” means in this codebase (confirmed)
The transaction “type” is an explicit field:
- `transaction.type === "Expense"` OR `transaction.type === "Money Received"`
Defined by `TRANSACTION_TYPES = ["Expense", "Money Received"]` in `script.js`.

So for AG-10 terminology:
- **Income** maps to **"Money Received"**
- **Expenses** maps to **"Expense"**

No `amount < 0` transactions exist; validation enforces amount > 0 (in paise).

---

## 2. Summary of approach (aligned to repo)
Implement **client-side filtering** of the already-loaded `transactions` array in `script.js`:

1. Add a simple, accessible **filter control** in `index.html` (radio group or segmented buttons) with options:
   - All
   - Income
   - Expenses
2. In `script.js`, introduce:
   - a `selectedTypeFilter` state (default `ALL`)
   - a pure function `filterTransactions(transactions, filter)` to derive visible items
3. Update rendering:
   - `renderTransactions(...)` should render **filtered** list, but **balance remains computed from all transactions** (existing behavior).
   - Empty state message changes based on filter vs “no transactions yet”.
4. Extend `tests/app.test.cjs`:
   - Validate new DOM control exists
   - Add integration tests for filter toggling and empty states

No backend/API changes are needed (app is localStorage-only).

---

## 3. Concrete file-by-file change list (with estimated complexity)

### `index.html` (Small)
- Add filter control markup inside the “Transaction history” section (near the history heading).
- Add IDs required for JS bindings and tests, e.g.:
  - `transaction-type-filter` container
  - individual radio inputs/buttons: `filter-all`, `filter-income`, `filter-expenses`
- Prefer: `<fieldset>` + `<legend>` for accessibility if using radios.

Complexity: low

### `styles.css` (Small)
- Add minimal styling for the filter control to match existing UI.
  - Spacing
  - Active state (if buttons)
  - Focus styles
- Keep styling simple (vanilla CSS).

Complexity: low

### `script.js` (Medium)
- Add a filter state variable, e.g. `selectedFilter = 'ALL|INCOME|EXPENSES'`.
- Add pure function: `filterTransactions(transactions, filter)`
  - All: return input as-is
  - Income: `type === "Money Received"`
  - Expenses: `type === "Expense"`
- Add event listeners to the filter control to update state and re-render.
- Update transaction history rendering to use the filtered list.
- Update empty-state message:
  - if there are 0 matches, show filter-specific copy
  - if there are 0 total transactions, show existing “no transactions yet” copy

Complexity: medium

### `tests/app.test.cjs` (Medium)
- Add tests to assert the filter control exists and defaults to All.
- Add tests for filtering behavior:
  - select Income filter → only “Money Received” items shown
  - select Expenses filter → only “Expense” items shown
  - empty state appears when no matches under a filter

Complexity: medium

---

## 4. Batches (independently testable)

### Batch A — UI scaffold (HTML + minimal CSS)
**Tasks**
- Add filter control markup (All/Income/Expenses)
- Ensure accessible labeling (fieldset/legend)
- Add minimal styles consistent with app

**DoD**
- Filter control renders and is accessible
- No JS behavior required yet

### Batch B — Filtering logic + rendering
**Tasks**
- Implement `filterTransactions()`
- Add filter state + event wiring
- Update list rendering to use filtered list
- Implement empty states (no matches vs no transactions)

**DoD**
- Selecting filter changes the visible transactions
- Selecting All restores full list
- Empty state appears when no matches

### Batch C — Automated tests
**Tasks**
- Extend Node tests to cover filter UI and behavior

**DoD**
- `node --test` passes
- Coverage includes filter selector logic and empty state

### Batch D (Optional) — Persistence / telemetry
**Tasks (only if required)**
- Persist last selected filter in localStorage
- Add analytics events (if repo has telemetry)

**DoD**
- Filter remains selected after reload (if chosen)
- Events emitted (if telemetry exists)

---

## 5. Test plan

### Unit tests
- `filterTransactions()` returns correct list for:
  - ALL
  - INCOME
  - EXPENSES
  - empty input

### Integration tests (existing harness)
- Filter control exists and defaults to All
- Toggling filter updates rendered list item count/content
- Empty state appears for filter with no matches

### Manual test checklist
1. Open app → go to history section
2. Verify filter options All/Income/Expenses visible
3. Add both Expense and Money Received transactions
4. Toggle filters and confirm list updates correctly
5. Verify empty state shown when applicable
6. Ensure focus/keyboard works on the filter control

---

## 6. Rollout considerations
- No feature flag expected for this small, client-side-only change.
- If desired, can gate behind a constant in `script.js`.

---

## 7. Risks and mitigations
- **Risk:** Misalignment between “Income/Expenses” labels and internal types.
  - **Mitigation:** Map explicitly: Income→Money Received, Expenses→Expense.
- **Risk:** Tests brittle due to DOM harness.
  - **Mitigation:** Use stable IDs and test minimal DOM text.

---

## 8. Assumptions and confirmations needed
**Assumptions (proposed defaults)**
- Default filter = **All**
- Persistence = **no** (resets on reload)
- Empty copy:
  - Income: “No income transactions found.”
  - Expenses: “No expense transactions found.”

**Confirmations needed**
1. Approve the mapping: Income→Money Received, Expenses→Expense.
2. Approve empty-state copy.
3. Approve persistence behavior.
4. Approve UI control type (radios recommended).
