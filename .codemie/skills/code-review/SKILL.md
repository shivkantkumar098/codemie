---
name: code-review
description: Reviews code changes for correctness, security, error handling, coverage, clarity, duplication, and dependency safety.
---

# Review Checklist

Follow the [SDLC workflow project rule](../../../CLAUDE.md) for artifact and review rules.

## 1. Correctness
- Does each component behave as specified in `requirements.md`?
- Does implementation match the approved architecture and plan?
- Are generated documentation sections accurate and deterministic?

## 2. Security
- Are secrets, tokens, API keys, and `.env` values excluded from output?
- Is user input validated?
- Are paths and file operations handled safely?

## 3. Error Handling
- Are API failures handled gracefully?
- Are missing source files, empty directories, and missing fields handled?
- Are errors actionable rather than silent or misleading?

## 4. Test Coverage
- Are happy paths covered?
- Are `Not Found`, missing-field, empty-input, and failure cases tested?
- Do tests validate expected output and regression behavior?

## 5. Code Clarity
- Are names self-explanatory?
- Is the logic easy to follow?
- Are abstractions appropriate?

## 6. DRY Principle
- Is logic unnecessarily duplicated?
- Could shared functionality reduce duplication without overengineering?

## 7. Dependency Safety
- Are dependency versions appropriate?
- Is there evidence of known vulnerabilities?
- Were available dependency or security checks run?
- Inspect actual manifests/lockfiles and scanner output when available; if they are unavailable, mark Not Verified rather than Passed.

## Review Evidence
- Inspect actual staged/unstaged diff and relevant untracked files, not only implementation notes.
- If no baseline diff is available, state that review is Blocked/Not Verified for diff scope.
- Mark repository-inapplicable checks Not Applicable with a brief rationale.

# Finding Format
For each finding, record:
- Finding ID: CR-001, CR-002, etc.
- Severity: Critical, High, Medium, or Low
- Review area
- File and line reference, when available
- Evidence
- Impact
- Recommended fix
- Status: Open, Resolved, Accepted, or Deferred

# Required Output
Create `code-review.md` containing:
1. Review scope and commit/diff inspected
2. Summary and review recommendation
3. Checklist results for all seven areas
4. Findings table
5. Positive observations
6. Unresolved risks and limitations
7. Final status: Approved, Changes Requested, or Blocked

Use `Not Verified` when a check could not be performed. Do not treat missing evidence as a pass.
