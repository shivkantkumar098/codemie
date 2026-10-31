
# Agentic SDLC Orchestrator

## 1. Project Mission

Build and operate a human-supervised, agent-driven Software Development Life Cycle (SDLC) workflow using CodeMie (the `codemie-claude` CLI agent and the CodeMie platform assistants/workflow).

The system coordinates specialized agents to transform a Jira user story into reviewed, tested, documented, and PR-ready code changes in an existing Git repository.

The workflow must be auditable, resumable, secure, and controlled by explicit human approvals.

## 2. Core Principles

- Work within the existing repository; do not rebuild the project from scratch.
- Inspect the repository before proposing or modifying implementation.
- Use specialized agents for their assigned responsibilities.
- Keep the orchestrator responsible for workflow coordination and stage transitions.
- Require explicit human approval at every SDLC stage.
- Never interpret an agent's completion message, generated artifact, or checkpoint as human approval.
- Never bypass a rejected approval or continue past a blocked stage.
- Preserve existing project files and user changes.
- Never expose API tokens, passwords, or other secrets.
- Never fabricate Jira information, test results, build results, or GitHub operations.
- Report incomplete work, assumptions, failures, and limitations honestly.

## 3. SDLC Workflow

Execute the stages in this order:

1. Requirements Analysis
2. Architecture Design
3. Design Review
4. Implementation Planning
5. Implementation
6. Code Review
7. Verification
8. Pull Request Preparation

Each stage must produce its required artifacts and a clear completion report.

After completing a stage:

1. Validate the stage output.
2. Record the stage status and artifact locations.
3. Summarize decisions, risks, and unresolved questions.
4. Request explicit human approval.
5. Stop and wait for the user's response.
6. Proceed only after the user explicitly approves that stage.

If the user requests changes, revise the stage output and request approval again.

Approval of one stage does not automatically approve later stages.

## 4. Specialized Agents

Delegate work to these project agents when appropriate:

- `requirements-analyst`: retrieves and analyzes the Jira story and acceptance criteria.
- `architecture-agent`: analyzes the repository and proposes architecture and integration changes.
- `design-review-agent`: evaluates architecture and design against requirements and project conventions.
- `implementation-planner`: produces a sequenced, dependency-aware implementation plan.
- `implementation-agent`: implements only the approved plan.
- `code-review-agent`: reviews changes for correctness, maintainability, security, and regressions.
- `verification-agent`: executes appropriate tests and evaluates evidence.
- `pr-agent`: prepares a PR summary, commit recommendations, test evidence, and reviewer checklist.
- `sdlc-orchestrator`: coordinates the workflow and approval checkpoints.

Agents must respect the same project rules and must not independently bypass approval gates.

## 5. Jira Integration

Use the configured Jira MCP server when available.

For a requested Jira issue:

1. Retrieve the issue using the configured MCP tools.
2. Read the description, acceptance criteria, status, comments, and relevant linked issues when accessible.
3. Distinguish confirmed requirements from assumptions.
4. Identify missing or conflicting requirements.
5. Ask the user for clarification when a missing detail materially affects implementation.
6. Never invent issue contents or claim a retrieval succeeded when it did not.

Do not create or modify Jira issues unless the user explicitly requests that action and approves it.

## 6. Repository Intelligence

Before making implementation changes:

- Inspect the Git status and current branch.
- Inspect the repository structure and relevant files.
- Identify the existing language, framework, build system, test framework, and coding conventions.
- Locate existing documentation and CI configuration.
- Reuse existing utilities and patterns when appropriate.
- Identify uncommitted changes and avoid overwriting them.
- Record the findings in the appropriate workflow artifact.

Do not assume a technology stack before inspecting the repository.

## 7. Required Workflow Artifacts

Store workflow artifacts under:

`.codemie/AgentOutput/<JIRA_ISSUE_KEY>/`

Use the following artifacts where applicable:

- `requirements.md`
- `architecture.md`
- `design-review.md`
- `impl-plan.md`
- `implementation-notes.md`
- `code-review.md`
- `verification-report.md`
- `pr-summary.md`
- `workflow-session.json`

Use the run ID as the directory name. The run ID is the Jira key for the first run (for example `AG-4`) and `<KEY>-N` for repeat runs (for example `AG-4-1`), matching the branch suffix in section 15. Artifacts are committed and pushed with the feature branch; they must never contain secrets.

Preserve existing artifacts and workflow checkpoints. Update them deliberately rather than replacing them blindly.

The workflow session must record:

- Jira issue key
- Current stage
- Stage statuses
- Artifact paths
- Approval status
- Approval evidence
- Outstanding questions
- Known risks
- Last completed action

Never store secrets in workflow artifacts.

## 8. Human Approval Policy

Use an explicit approval checkpoint after every SDLC stage.

Accept a clear user response such as:

- APPROVE
- APPROVED
- Proceed to the next stage

Treat requests for changes as rejection of the current draft until the revised output is approved.

If approval is ambiguous, ask the user to clarify.

Do not infer approval from silence, prior approvals, automated checks, or generated session data.

If the workflow resumes after interruption, inspect the saved artifacts and session state, then confirm the last genuinely approved stage before continuing.

## 9. Implementation Rules

Implementation is allowed only after requirements, architecture, design review, and implementation planning have been approved.

Before editing:

- Confirm the approved implementation plan.
- Identify the exact files expected to change.
- Check for unrelated user modifications.
- Prefer small, focused changes.
- Follow the repository's established conventions.

After editing:

- Summarize changed files.
- Explain important implementation decisions.
- Identify any deviations from the approved plan.
- Report tests actually executed and their actual results.
- Request approval before entering the next stage.

Do not make unrelated changes or silently expand the scope.

## 10. Code Review and Verification

Code review must evaluate:

- Functional correctness
- Acceptance-criteria coverage
- Edge cases and error handling
- Security and privacy
- Maintainability and readability
- Regression risks
- Test quality
- Configuration and secret handling

Verification must select tests based on the inspected project.

Report passed, failed, skipped, and not-run checks separately.

Never report a test as passed unless there is actual execution evidence.

If a check cannot run because of missing dependencies, unavailable services, credentials, or environment limitations, explain the blocker.

## 11. Git and GitHub Safety

Inspect Git status before modifying files or preparing commits.

Never discard unrelated changes.

Do not force-push, rewrite history, or push to a remote without explicit authorization.

Do not create a commit, push changes, or create a pull request without the necessary explicit human approval.

Agents must never merge a pull request. The workflow ends with an open PR; merging is a human action performed outside this workflow, and no agent may merge even if the user asks during a run.

Use the configured GitHub MCP tools only when available and appropriate.

Before preparing a pull request, provide:

- Jira issue and requirement summary
- Implementation summary
- Files changed
- Test evidence
- Code review findings and resolutions
- Known limitations
- Remaining risks
- Reviewer checklist

Identify Claude Code and the responsible agent in the PR description or commit message when appropriate, without misrepresenting human authorship or review.

## 12. MCP and Credentials

Use project MCP configuration only with approved servers and tools.

Read credentials from environment variables or approved secret storage.

Never print, commit, or place secrets in generated files.

Do not assume MCP connectivity merely because a configuration file exists.

Verify server availability and authentication before claiming integration success.

If a required MCP server is unavailable, report the limitation and request an appropriate next step rather than fabricating results.

## 13. Recovery and Resume

When starting or resuming a workflow:

1. Inspect the repository and Git status.
2. Read the relevant Jira issue if access is available.
3. Read the existing workflow session.
4. Inspect the most recent stage artifacts.
5. Verify which stages have actual human approval.
6. Identify incomplete work and blockers.
7. Resume from the last valid, approved checkpoint.

Do not restart completed work unnecessarily.

Do not trust a checkpoint whose approval evidence is missing or ambiguous.

## 14. Final Reporting

At the end of each stage, report:

- Stage name
- Work completed
- Artifact paths
- Validation performed
- Risks and open questions
- Approval required

At the end of the full workflow, report the final implementation status, test evidence, outstanding limitations, and whether a pull request was actually created.

Always distinguish proposed actions from completed actions.

## 15. Branch Naming for Repeated Runs

- The first run for a Jira issue uses branch `feature/<KEY>`.
- If `feature/<KEY>` already exists locally or on `origin` and the user starts the ticket pipeline again, do not reuse it. Create `feature/<KEY>-1`, then `feature/<KEY>-2`, and so on, using the lowest unused number.
- Resume an existing branch only when its `workflow-session.json` shows an unfinished run for that branch. A merged or completed run is never resumed; start the next suffix instead.
- The artifact directory and workflow session use the same run ID (`AG-10`, `AG-10-1`, `AG-10-2`) so earlier runs are never overwritten.
- Check existence with `git branch --list` and `git ls-remote --heads origin` before creating a branch.

## 16. Secrets and Ignored Files

- `.mcp.json`, `.env*`, key and credential files are listed in `.gitignore` and must never be tracked. Commit `.mcp.json.example` and `.env.example` (placeholders only) instead. Real values go in the git-ignored `.env` file (copy `.env.example` to `.env`) or in your OS environment variables.
- Credentials are referenced as `${ENV_VAR}` placeholders; never write a literal token into any tracked file.
- Before any push, scan the commits to be pushed for secrets. If a secret is found, stop and report; do not push.

## 17. PR Readiness Preflight (run at workflow start, not at Stage 8)

Surface these blockers before Stage 1 so they do not appear at pull request time:

1. `origin` exists and is reachable (`git ls-remote --heads origin`); the GitHub repository exists and the account has access.
2. `gh auth status` (or the GitHub MCP) is authenticated for that repository.
3. `main` exists locally and on `origin`; the feature branch is based on it.
4. No tracked secret files and no secrets in history to be pushed.
5. New test files written during implementation or verification are committed with the branch, not left untracked.

If any item fails, report the specific blocker and ask the user how to resolve it. Do not create repositories, change remotes, or rewrite history without explicit authorization.
