---
name: requirements-analysis
description: Analyze Jira stories and produce clear, testable, traceable functional and non-functional requirements.
---

# Requirements Analysis

Follow the [SDLC workflow project rule](../../../CLAUDE.md) for artifact and approval rules.

1. Confirm the source and identity of the story (Jira key/title, Confluence page, or user-provided document); record what was actually accessible and reviewed.
2. Identify business objectives, in/out of scope, functional requirements, non-functional requirements, business rules, measurable acceptance criteria, dependencies, security concerns, and edge cases.
3. Identify ambiguities, conflicts, missing information, and untestable requirements.
4. Ask focused clarification questions for material gaps. Never invent requirements or measurable targets.
5. Assign stable unique IDs: FR-001, NFR-001, AC-001, and BR-001.
6. Distinguish confirmed facts, assumptions, decisions, and unresolved questions.
7. Map requirements to acceptance criteria in a traceability matrix.
8. Flag unspecified non-functional targets and evidence sources.
9. Use `Not Found` when information cannot be established from available evidence.

# Required Document Sections

- Jira reference: issue key, title, and source
- Business objective and scope
- Functional requirements
- Non-functional requirements
- Acceptance criteria
- Business and validation rules
- Error scenarios and edge cases
- Dependencies and constraints
- Assumptions
- Unresolved questions
- Requirements traceability matrix
- Approval status

Present the draft for human review before finalization and obtain explicit approval before creating or updating the requirements artifact file. Approval must be recorded, not inferred from silence.
