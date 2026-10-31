---
name: design-review
description: Conduct a structured senior-level review of architecture before production implementation.
---

# Design Review

Follow the [SDLC workflow project rule](../../../CLAUDE.md) for artifact and review rules.

Review the architecture against the approved requirements and repository evidence.

## Review Areas
1. Requirements coverage and traceability
2. Component responsibilities and boundaries
3. Data flow and integration contracts
4. Security, secrets, and sensitive data handling
5. Error handling and failure scenarios
6. Maintainability, testability, and scalability
7. Technology choices and compatibility
8. Missing dependencies, assumptions, and operational concerns

## Finding Format
For every finding, record:
- Finding ID: DR-001, DR-002, etc.
- Severity: Critical, High, Medium, or Low
- Category
- Evidence or affected architecture section
- Risk or impact
- Recommended action
- Status: Open, Accepted, Resolved, or Deferred

Do not report speculation as a confirmed defect.

## Required Output
Create `design-review.md` with:
- Review scope and artifacts reviewed
- Summary and overall recommendation
- Findings table
- Proposed design decisions
- User-approved decisions
- Accepted or deferred risks
- Unresolved questions
- Final review status

Use `Not Found` for information that cannot be verified.

Do not approve the design automatically. Record the actual review outcome and obtain user approval for material changes.
