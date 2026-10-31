---
name: implementation
description: Implements approved implementation tasks incrementally, with tests, repository consistency, and verifiable results.
---

# Implementation Process

Follow the [SDLC workflow project rule](../../../CLAUDE.md) for implementation and approval rules.

1. Select the highest-priority task whose dependencies are complete.
2. Confirm its acceptance criteria and affected files.
3. Inspect existing code before making changes.
4. Implement the smallest change that satisfies the task.
5. Follow existing coding conventions and architecture.
6. Add or update tests for expected behavior and edge cases.
7. Run relevant tests, linting, and static checks when available.
8. Review the diff for unintended changes and exposed secrets.
9. Record evidence and update implementation notes.

# Quality Rules
- Do not change unrelated functionality.
- Do not introduce unnecessary dependencies.
- Validate user inputs and handle failures gracefully.
- Preserve existing documentation and manually maintained content.
- Use `Not Found` for unknown generated documentation fields when required by the approved requirements.
- Do not fabricate test results or completion status.

# Implementation Notes
Save to `implementation-notes.md` with:
- Completed task IDs
- Summary of changes
- Files added or modified
- Tests and commands executed
- Actual results
- Outstanding blockers and incomplete tasks
