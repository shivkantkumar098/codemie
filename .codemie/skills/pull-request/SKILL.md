---
name: pull-request
description: Prepares a review-ready Pull Request description, changelog entry, test evidence, and reviewer checklist.
---

# PR Preparation Process

Follow the [SDLC workflow project rule](../../../CLAUDE.md) for GitHub MCP and authorization rules.

1. Validate implementation and verification artifacts.
2. Inspect actual repository changes.
3. Inspect Git status, source/target branches, staged and unstaged changes, and relevant untracked files. If no baseline diff is available, state that PR readiness is Blocked/Not Verified.
4. Identify every added, modified, and deleted file from actual repository evidence.
5. Explain the reason for each change.
6. Extract test evidence from real execution results or a confirmed CI run.
7. Record Not Found items, accepted risks, unresolved blockers, and out-of-scope work separately.
8. Generate a reviewer checklist.
9. Follow existing changelog conventions; if none exist, propose an entry without inventing release details.
10. Validate that the PR description matches the actual diff.

# Required PR Description

## Summary
Provide a concise overview of what was built and why in 2–3 sentences.

## Changes Made
Provide a bulleted list of all files added or modified and the reason for each. Include deleted files when applicable.

## Test Evidence
Include actual test commands and relevant output, or a confirmed CI results link. Clearly identify failed, blocked, or unexecuted checks.

## Known Limitations
List unresolved `Not Found` fields, accepted risks, environmental constraints, and explicitly out-of-scope work.

## Reviewer Checklist
Generate a Markdown tick-list covering:
- [ ] Requirements and acceptance criteria are satisfied.
- [ ] Implementation matches the approved architecture.
- [ ] Secrets and sensitive values are excluded.
- [ ] Error handling and missing-input scenarios are covered.
- [ ] Unit and integration test results have been reviewed.
- [ ] Generated documentation is accurate and deterministic, or is marked Not Applicable when the project has no generator.
- [ ] Changelog and known limitations are accurate.
- [ ] Source and target branches and changed-file list match the actual diff.

# Changelog
- Follow the repository's existing changelog format.
- Describe only verified changes.
- Do not invent version numbers, release dates, or unreleased features.

# Required Output
Save `pr-summary.md` with:
1. PR title
2. Complete PR description
3. Changelog entry
4. Reviewer checklist
5. Source branch and target branch, when verified
6. Readiness status and outstanding blockers

Use `Not Verified` where evidence is unavailable. Do not invent a PR URL or claim a PR was created unless confirmed.
Preparation, approval of a draft, commit, push, and PR creation are separate actions. Obtain explicit authorization for each repository-changing action; report the confirmed PR URL/status only after successful creation.
