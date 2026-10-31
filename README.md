# CodeMie Agentic SDLC (capstone demo)

Same Jira-driven, 8-stage, human-approved SDLC as the Claude Code and GitHub Copilot versions, run on CodeMie in two ways:

| Track | What | Where |
|---|---|---|
| A. CodeMie CLI | `codemie-claude` runs the `sdlc-orchestrator` agent with 8 specialist subagents, skills, policy hook, Jira + GitHub MCP | `.codemie/` (loaded as the `sdlc` plugin), `CLAUDE.md`, artifacts in `.codemie/AgentOutput/<KEY>/` |
| B. CodeMie platform | 9 assistants (`CM-SDLC 0..8`) + workflow `CM-SDLC Pipeline` with `interrupt_before` approval gates, Jira integration `cm-sdlc-jira` | `platform/`, project `shivkant_kumar@epam.com` |

Target app: the vanilla JS finance tracker (`index.html`, `script.js`, `styles.css`, `tests/`). Demo ticket: **AG-10 "Filter transactions by type"**.

## Stages
Requirements -> Architecture -> Design Review -> Implementation Planning -> Implementation -> Code Review -> Verification -> Pull Request. Every transition needs explicit human approval; agents never merge.

## Track A - CLI demo
1. `cp .env.example .env`, fill `JIRA_USERNAME`, `JIRA_API_TOKEN`, `GITHUB_PAT`; load them: `set -a; source .env; set +a`. `.mcp.json` (git-ignored) is already present; recreate it from `.mcp.json.example` if missing.
2. Needs a git repo with `origin` and `main` (see "Open items").
3. Run: `codemie-claude --plugin-dir .codemie --settings .codemie/settings.local.json --agent sdlc:sdlc-orchestrator` then say `Start the SDLC for AG-10`. Approve each stage when asked.
4. Check guardrails: `node .codemie/hooks/validate-sdlc-policy.cjs` (12 synthetic cases), `node --test tests/` (app tests).

## Track B - Platform demo
1. CodeMie UI -> Assistants -> **CM-SDLC 0 Orchestrator**: "Start the SDLC for Jira issue AG-10" (delegates to the stage assistants), **or**
2. Workflows -> **CM-SDLC Pipeline** -> run with input `AG-10`; it pauses before stages 2-8 for your approval.
3. Rebuild/redeploy after editing any `.codemie/agents` or `.codemie/skills` file (single source of truth):
   ```
   node platform/build.cjs
   node platform/deploy.cjs assistants
   node platform/deploy.cjs workflow
   node platform/deploy.cjs integrations <path-to-.env>   # Jira creds; never printed
   ```

## Platform limitations (be upfront in the demo)
- Platform assistants have no local shell: the Verification assistant can only use `code_executor`; real `node --test` runs happen in Track A.
- Artifacts are returned in chat; approving a workflow gate makes the next state commit the approved artifact to `.codemie/AgentOutput/<KEY>/` on `feature/<KEY>` via the Git toolkit (a final `stage-9-save` state saves `pr-summary.md`). Only that file is committed; PR creation and merge stay separate.
- The Claude hook (`sdlc-policy.cjs`) applies to Track A only; on the platform the guard is the prompts, the `interrupt_before` gates, and the absence of any merge tool.

## Open items
- Local git repo is initialized with `origin` = https://github.com/shivkantkumar098/codemie.git (empty remote, no `main` yet). Nothing is committed or pushed; the first commit of the baseline to `main` and its push need explicit authorization. The SDLC preflight will block until `main` exists on origin.
- Platform Git integration `cm-sdlc-github` is bound to that repo.
- Dry-run the workflow once in the UI before the demo; the workflow run itself was not executed from the CLI.
