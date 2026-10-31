---
name: implementation-planning
description: Creates prioritized, dependency-ordered implementation plans from approved requirements and architecture.
---

# Planning Process

Follow the [SDLC workflow project rule](../../../CLAUDE.md) for planning and approval rules.

1. Extract requirements, components, constraints, and design decisions.
2. Inspect the repository to identify affected files and existing dependencies.
3. Break work into small, independently verifiable tasks.
4. Assign IDs: `TASK-001`, `TASK-002`, and so on.
5. Prioritize tasks as P0, P1, or P2.
6. Define dependencies and blockers explicitly, including each blocker's exact prerequisite and unblocking condition. Do not treat a deferrable risk as a blocker by default.
7. Include acceptance criteria for each task.
8. Identify testing and documentation tasks.
9. Verify traceability to requirements and architecture, including tests and documentation work.

# Required Output: impl-plan.md

## 1. Context
Jira issue, requirements source, architecture source.

## 2. Task Breakdown
Include a table with:

| Task ID | Priority | Task | Affected Files | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|

## 3. Dependency Order
List tasks in execution order.

## 4. Blocked Tasks
For each blocked task, state the blocking task and the condition required to unblock it.

## 5. Testing Strategy
Identify unit, integration, and relevant edge-case tests.

## 6. Requirement Traceability
Map requirement IDs to implementation task IDs.

## 7. Risks and Assumptions
Record verified risks, assumptions, and unresolved questions.

## 8. Approval and Readiness
Record whether the plan is draft, awaiting approval, approved, or superseded. Plan creation is not approval.

# Rules
- Dependencies must reference valid task IDs.
- Do not mark a task completed before implementation.
- Do not invent file paths or technical details.
- Use `Not Found` when evidence is unavailable.
