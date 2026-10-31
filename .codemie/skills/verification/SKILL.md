---
name: verification
description: Verifies implementation behavior, test coverage, error handling, and generated documentation quality.
---

# Verification Process

Follow the [SDLC workflow project rule](../../../CLAUDE.md) for verification and evidence rules.

## 1. Test Discovery
- Inspect existing unit and integration tests.
- Identify available test runners and project commands.
- Map requirements and acceptance criteria to verification cases.

## 2. Code Verification
- Run relevant unit tests.
- Run integration tests where the environment supports them.
- Run available linting, type checking, and static analysis.
- Record commands, exit codes, and actual outcomes.
- Gate on checks applicable to approved acceptance criteria, changed scope, or explicit repository/branch-protection policy. Do not run stale configured commands when their implementation is absent and behavior is not required; record Not Applicable with evidence. Keep actually executed failures visible, but do not let a pre-existing unrelated failure block the ticket unless it is an explicit required check.

## 3. Edge-Case Verification
Verify appropriate cases, including:
- Missing source files or directories
- Empty source directories
- Missing route, provider, or feature metadata
- Missing fields represented as `Not Found`
- Invalid inputs and API failures, where applicable
- Secret and environment-variable exclusion

## 4. Documentation Quality
- First determine whether the repository has generated documentation, its generator, source-of-truth files, and designated generated sections.
- Validate generated content against actual repository sources only where such a mechanism exists.
- Validate required headers, ordering, and Markdown formatting when specified by requirements or repository conventions.
- Confirm only designated generated sections are updated and manual sections are preserved when a generator exists.
- Run generation twice against an unchanged source snapshot and compare outputs for determinism when generation exists.
- If a check does not apply, mark it Not Applicable and state the repository evidence; do not force unrelated paths or omit the check silently.

## 5. Final Assessment
Classify each check as:
- Passed
- Failed
- Blocked
- Not Verified
- Not Applicable

Do not mark a check Passed without execution or verifiable evidence.
An approved waiver permits continuation only where the workflow allows it; it does not change a Failed, Blocked, or Not Verified result into Passed.
Not Applicable checks do not block a ticket when their applicability rationale and repository evidence are recorded. A missing tool is Blocked/Not Verified only when that tool is required for the approved scope or an explicit merge gate.

# Required Output: verification-report.md

## 1. Verification Summary
Overall status and scope.

## 2. Environment
Relevant tools, dependencies, and limitations.

## 3. Commands Executed
Command, purpose, exit code, and actual result.

## 4. Unit Test Results
Results and uncovered cases.

## 5. Integration Test Results
Results and environmental blockers.

## 6. Documentation Quality Checks
Source accuracy, section preservation, formatting, and determinism.

## 7. Security and Error-Handling Checks
Secret exclusion, input validation, and failure scenarios.

## 8. Outstanding Issues
Failures, blockers, and unverified checks.

## 9. Final Verdict
Verified, Failed, or Blocked, with justification.
