---
name: architecture-design
description: Develop high-level architectures from approved requirements, including component responsibilities, technology decisions, diagrams, data flow, and risks.
---

# Architecture Design

Follow the [SDLC workflow project rule](../../../CLAUDE.md) for artifact and approval rules.

1. Extract functional requirements, non-functional requirements, acceptance criteria, constraints, and dependencies from the approved requirements document.
2. Inspect the repository to identify existing components, frameworks, integrations, and architectural conventions.
3. Define the system boundaries and propose the major components.
4. Document each component's responsibilities, inputs, outputs, and dependencies.
5. Describe component interactions and end-to-end data flow.
6. Recommend technologies consistent with the repository and requirements. Justify significant choices, dependencies, alternatives, and trade-offs when material.
7. Create Mermaid component and end-to-end data-flow diagrams where useful; if not useful, explain why rather than adding misleading diagrams.
8. Evaluate security, error handling, maintainability, scalability, and operational risks.
9. Map components and decisions to requirement/acceptance IDs.
10. Separate verified existing facts, proposed decisions, assumptions, unresolved questions, accepted risks, and blockers.

# Required Output Sections

- Architecture overview and objectives
- Requirements and constraints
- Existing system context
- Proposed architecture
- Component responsibilities
- Technology choices and rationale
- Component diagram
- Data-flow diagram
- Security and error-handling considerations
- Dependencies and integration points
- Risks, trade-offs, and assumptions
- Requirements-to-components traceability
- Approval status and unresolved decisions

Do not invent technical facts or introduce requirements without justification. Mark unavailable information as `Not Found`.
