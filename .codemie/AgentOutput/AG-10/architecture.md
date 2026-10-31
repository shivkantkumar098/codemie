# Architecture Design — AG-10: Filter transactions by type

> **Ticket**: AG-10 — “Filter transactions by type”  
> **Stage**: CM-SDLC 2 — Architecture Design  
> **Status**: Draft for human review (saved for traceability)

## Architecture overview and objectives
Add a **transaction type filter** to the transaction history view so a user can switch between:
- **All**
- **Income**
- **Expenses**

Selecting a filter updates the displayed list accordingly. If no transactions match, show a clear empty state message.

Primary objectives:
- Minimal disruption to existing transaction history rendering.
- Predictable and testable state management.
- Good UX (immediate feedback, accessibility, resiliency).

## Requirements mapping
- FR-1/AC1: Provide filter options All/Income/Expenses
- FR-2/AC2: Selecting option filters list to matching transactions
- FR-3/AC3: All shows full history
- FR-4/AC4: Empty state message when no matches

## Assumptions / Unknowns
- Repository stack (web/mobile), UI framework, and state library are **Not Found** in this design context.
- Transaction history screen exists and renders a list of transactions.
- Transaction model includes either a `transactionType` field or a mappable indicator.

## Proposed UI structure (system-level)
- **TransactionHistoryScreen** (existing)
  - Fetches/receives transactions list
  - Owns the selected filter state (`ALL|INCOME|EXPENSE`)
  - Derives `visibleTransactions` via selector/function
  - Renders:
    - **TransactionTypeFilterControl**
    - **TransactionList**
    - **EmptyState** (when `visibleTransactions` is empty)

### Filter control pattern
Use existing design system control:
- Segmented control / tabs / radio group

Accessibility requirements:
- Proper roles/labels
- Keyboard navigation (left/right for segmented/tabs)
- Visible focus state

## State management approach
- Keep filter state local to the history screen unless product requires cross-screen persistence.
- Derive filtered list with memoization where available (`useMemo`, selector memoization, etc.).

Pseudo:
- `filter: 'ALL' | 'INCOME' | 'EXPENSE'`
- `visibleTransactions = filterTransactions(transactions, filter)`

## Filtering logic
### Canonical type determination (needs confirmation)
Preferred approach:
1. If transaction has explicit `transactionType`/`kind`, use that.
2. Else infer from amount sign.

Unknown/zero amount policy must be defined.

## Data flow
1. Screen loads transactions (existing mechanism).
2. User selects filter option.
3. UI updates selected filter state.
4. Selector recomputes `visibleTransactions`.
5. List renders visible transactions, or empty state.

## API / backend considerations
Default: client-side filtering.

If transactions are server-paginated or dataset is large:
- Consider adding query param `type=income|expense|all` to the history endpoint.
- Ensure authorization/user scoping is always applied together with the type filter.

## Performance considerations
- Filtering should be O(n) on list size.
- Memoize derived list.
- Avoid refetching on every filter toggle unless server-side filtering is required.

## Error handling
- If transaction data is missing type fields, do not crash.
- Treat unknown types per defined policy; at minimum include them in All.

## Telemetry hooks (if existing)
If analytics is already present:
- Track event: `transaction_history_filter_selected` with property `{filter: ALL|INCOME|EXPENSE}`.
- Optionally track empty-state exposures.

## Risks
- Incorrect classification without a confirmed source-of-truth.
- Server-side pagination may require backend support to avoid filtering only the currently-loaded page.
- UX inconsistency if control pattern differs from app conventions.

## Decisions needing confirmation
1. Source-of-truth for Income/Expense (explicit type vs amount sign vs hybrid).
2. Behavior for `amount=0` and unknown types.
3. Whether filter persists across navigation.
4. Whether history is paginated/server-driven.
5. Exact empty-state copy.
6. Analytics requirements.
