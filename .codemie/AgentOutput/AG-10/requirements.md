# Requirements — AG-10: Filter transactions by type

> **Ticket**: AG-10 — “Filter transactions by type” (Story)  
> **Stage**: CM-SDLC 1 — Requirements Analysis

> **Source**: Jira issue AG-10 description + acceptance criteria

## Jira reference
- **Issue key:** AG-10
- **Title:** Filter transactions by type
- **Issue type:** Story

## Problem statement
Users reviewing a transaction history need a quick way to narrow the list to only **Income** or only **Expenses**. Without filtering, reviewing mixed transactions is slow and error-prone.

## Goal
Add a type filter to the transaction history so users can switch between **All / Income / Expenses** and quickly review one kind of transaction.

## Scope

### In scope
- Display a filter control with options:
  - **All**
  - **Income**
  - **Expenses**
- When an option is selected, only matching transactions are shown in the history list
- Selecting **All** restores the full transaction history
- Show a clear empty state message when no transactions match the current filter

### Out of scope (unless later required)
- New transaction types beyond Income/Expenses
- Sorting, search, date ranges, multi-filtering
- Editing/categorizing transactions
- Backend schema changes or new API endpoints (**Not Found** in Jira)

## Functional requirements

1. **FR-1: Filter options**
   - The history view provides **All, Income, Expenses** options.
   - Default selection: **TBD** (proposed: **All**).

2. **FR-2: Apply filter**
   - When user selects a filter option, the list updates to only transactions that match that option.
   - Filter applies to displayed list only (no data mutation).

3. **FR-3: All shows full history**
   - Selecting **All** shows the full history (i.e., no type filter).

4. **FR-4: Empty state**
   - If the current filter results in 0 transactions, show a clear empty message (copy TBD).

## Data definition (Income vs Expense)
**Not Found** in Jira: the canonical field/definition for transaction type.

Proposed options to confirm:
- Use explicit field (`transactionType`) **or** derive from amount sign.

Edge cases to confirm:
- `amount = 0` (zero-amount transactions)
- Unknown/other transaction types (transfers, adjustments, etc.)

## UX notes
- Filter control should be discoverable and accessible (tabs/segmented control/radio, per existing design system).
- Switching filters should be immediate and not reload data unless the app is server-paginated.

## Non-functional requirements
- **Accessibility**: keyboard navigability, correct ARIA labels/roles for filter control
- **Performance**: filtering should be fast on typical list sizes (memoize derived list if needed)
- **Reliability**: filter must not crash on missing/unknown type fields

## Acceptance criteria traceability
- AC1: History has options for All/Income/Expenses → FR-1
- AC2: Selecting option shows only matching transactions → FR-2
- AC3: Selecting All shows full history → FR-3
- AC4: No matches show a clear empty message → FR-4

## Open questions (blockers)
1. Source-of-truth for Income/Expense (explicit type field vs amount sign)?
2. How should `amount = 0` and unknown/other types be treated under filters?
3. Should filter persist when navigating away/back, or reset to All?
4. Are transactions paginated/infinite-scroll, and does filtering need server-side support?
5. What empty-state message copy should be used?
6. Is analytics tracking required for filter selections?
