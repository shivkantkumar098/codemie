
# Claude Code SDLC Policy Hooks

## Purpose

These hooks provide tool-level guardrails for the Agentic SDLC workflow.

The policy script is:

`.codemie/hooks/sdlc-policy.cjs`

The synthetic validation script is:

`.codemie/hooks/validate-sdlc-policy.cjs`

## Registered Events

The project settings register the policy script for:

- `SessionStart`: injects SDLC workflow reminders into Claude's context.
- `PreToolUse`: checks selected tool calls before execution.

## Current Policy Behavior

| Operation | Hook behavior |
|---|---|
| Normal source file edit | No hook decision; normal Claude permissions apply |
| Write to protected workflow configuration | Deny |
| Recognized destructive shell command | Deny |
| Git commit, push, merge, or PR mutation | Ask for confirmation |
| Recognized mutating MCP operation | Ask for confirmation |
| Unknown MCP operation | Ask for confirmation |
| Recognized read-only MCP operation | No hook decision; normal permissions apply |
| Malformed JSON or missing event | Exit with code 2 |

An absent hook decision does not mean the action is automatically approved. Claude Code's normal permission system still applies.

## Protected Configuration

The current policy protects:

- `.codemie/hooks/hooks.json`
- `.codemie/settings.local.json`
- `.codemie/hooks/`
- `.codemie/agents/`
- `.codemie/skills/`
- `.cursor/`
- `.mcp.json`
- `.env` and `.env.*`
- `.github/agents/`
- `.github/skills/`
- `.github/instructions/`
- `.github/hooks/`

Review this list before adding other protected paths.

## Validation

Run these commands from the repository root:

```powershell
node --check .codemie/hooks/sdlc-policy.cjs

node --check .codemie/hooks/validate-sdlc-policy.cjs

node .codemie/hooks/validate-sdlc-policy.cjs
```

The validation script uses synthetic inputs and does not intentionally connect to Jira or GitHub or perform external mutations.

Passing synthetic tests demonstrates that the tested cases behave as expected. It does not prove that every possible shell command, MCP tool, or path is correctly classified.

## Important Limitations

1. The policy uses lightweight string and regular-expression checks, not a complete shell parser.
2. The MCP operation classifier relies on tool names. A misleading or unfamiliar tool name may be misclassified.
3. The read-only MCP allowlist is only a list of operations that receive no hook decision. Normal Claude permissions still apply.
4. These hooks do not independently track human approval for every SDLC stage.
5. Workflow instructions and saved checkpoints are not proof of approval.
6. Protected-file rules can also prevent routine agents from editing their own configuration.
7. Hooks are one layer of defense, not a replacement for Claude Code permission settings, Git protection, code review, or human oversight.

## Human Approval Requirements

Before moving to the next SDLC stage:

1. Review the current stage's artifacts.
2. Review test results, assumptions, and unresolved risks.
3. Obtain explicit human approval.
4. Record the approval and its evidence in the workflow session.
5. Continue only after approval is confirmed.

Before GitHub or Jira mutations, inspect the proposed action and explicitly authorize it.

## Official Reference

Claude Code hooks documentation:

https://code.claude.com/docs/en/hooks
