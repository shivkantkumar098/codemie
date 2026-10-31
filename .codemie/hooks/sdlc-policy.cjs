
"use strict";

const path = require("node:path");

const POLICY_REMINDER = [
  "SDLC workflow policy:",
  "1. Follow the approved SDLC stage order defined in CLAUDE.md.",
  "2. Request explicit human approval after every stage.",
  "3. A workflow checkpoint is progress metadata, not proof of human approval.",
  "4. Do not commit, push, or create a pull request without explicit authorization. Never merge a pull request; raise it and stop.",
  "5. Do not expose secrets or credentials.",
  "6. Protected configuration and policy files must not be modified by routine workflow agents.",
  "7. Review test evidence honestly; never fabricate test results.",
  "8. Hooks provide tool-level guardrails, not complete enforcement of stage approvals."
].join("\n");

const PROTECTED_PATHS = [
  ".codemie/hooks/hooks.json",
  ".codemie/settings.local.json",
  ".codemie/hooks/",
  ".codemie/agents/",
  ".codemie/skills/",
  ".cursor/",
  ".mcp.json",
  ".env",
  ".github/agents/",
  ".github/skills/",
  ".github/instructions/",
  ".github/hooks/"
];

const READ_ONLY_MCP = new Set([
  "get_issue",
  "getissue",
  "get_jira_issue",
  "getjiraissue",
  "search_issues",
  "searchissues",
  "search_jira_issues",
  "searchjiraissues",
  "list_issues",
  "listissues",
  "get_file_contents",
  "getfilecontents",
  "search_code",
  "searchcode",
  "get_pull_request",
  "getpullrequest",
  "list_pull_requests",
  "listpullrequests"
]);

const MUTATING_MCP_WORDS =
  /(^|_)(create|update|edit|delete|remove|write|add|comment|transition|assign|merge|push|commit|approve|close|reopen|publish|dispatch|trigger|submit)(_|$)/i;
function emit(value) {
  process.stdout.write(JSON.stringify(value) + "\n");
}

function preToolDecision(permissionDecision, reason) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision,
      permissionDecisionReason: reason
    }
  };
}

function normalizePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+/g, "/")
    .toLowerCase();
}

function isProtectedPath(value) {
  const target = normalizePath(value);
  if (!target) return false;

  return PROTECTED_PATHS.some((entry) => {
    const protectedPath = normalizePath(entry);

    if (protectedPath.endsWith("/")) {
      return target === protectedPath.slice(0, -1) ||
        target.startsWith(protectedPath);
    }

    return target === protectedPath;
  }) ||
    target === ".env.example" ||
    target.startsWith(".env.") ||
    target.includes("/.env");
}

function getTargetPaths(input) {
  const toolInput = input.tool_input || {};
  const values = [
    toolInput.file_path,
    toolInput.path,
    toolInput.notebook_path,
    toolInput.target_file
  ];

  return values.filter((value) => typeof value === "string");
}

function isDestructiveCommand(command) {
  const text = String(command || "");

  const patterns = [
    /\brm\s+(?:-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b/i,
    /\brm\s+-rf\b/i,
    /\brmdir\s+\/s\b/i,
    /\bRemove-Item\b.*\s-Recurse\b.*\s-Force\b/i,
    /\bRemove-Item\b.*\s-Force\b.*\s-Recurse\b/i,
    /\bdel\s+\/f\s+\/s\b/i,
    /\bgit\s+reset\s+--hard\b/i,
    /\bgit\s+clean\s+-[a-z]*f/i,
    /\bgit\s+push\b.*--force\b/i,
    /\bgit\s+push\b.*\s-f(?:\s|$)/i
  ];

  return patterns.some((pattern) => pattern.test(text));
}

function isGitMutation(command) {
  const text = String(command || "");

  return /\bgit\s+(commit|push|merge|rebase|cherry-pick|tag)\b/i.test(text) ||
    /\bgh\s+pr\s+(create|merge|close|review)\b/i.test(text);
}

function isMergeCommand(command) {
  return /\bgh\s+pr\s+merge\b/i.test(String(command || "")) ||
    /\bgit\s+merge\b/i.test(String(command || ""));
}

function classifyMcp(toolName) {
const normalized = String(toolName || "")
  .replace(/^mcp__[^_]+__/, "")
  .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");

  if (!String(toolName || "").startsWith("mcp__")) {
    return "not-mcp";
  }

  if (READ_ONLY_MCP.has(normalized)) {
    return "read";
  }

  if (MUTATING_MCP_WORDS.test(normalized)) {
    return "mutating";
  }

  return "unknown";
}

function handle(input) {
  const event = input.hook_event_name;

  if (event === "SessionStart") {
    emit({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: POLICY_REMINDER
      }
    });
    return 0;
  }

  if (event !== "PreToolUse") {
    process.stderr.write(
      "SDLC policy hook received an unsupported event: " +
      String(event || "(missing)") + "\n"
    );
    return 2;
  }

  const toolName = String(input.tool_name || "");
  const toolInput = input.tool_input || {};

  if (!toolName) {
    process.stderr.write("SDLC policy: missing tool_name.\n");
    return 2;
  }

  // Never allow routine workflow agents to rewrite their own policy.
  if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(toolName)) {
    for (const target of getTargetPaths(input)) {
      if (isProtectedPath(target)) {
        emit(preToolDecision(
          "deny",
          "Protected workflow configuration cannot be modified through routine agent actions: " +
          path.basename(target)
        ));
        return 0;
      }
    }
  }

  // Block clearly destructive shell commands.
  if (toolName === "Bash" || toolName === "PowerShell") {
    const command = toolInput.command || "";

    if (isDestructiveCommand(command)) {
      emit(preToolDecision(
        "deny",
        "Destructive command blocked by the SDLC policy hook. Review the command and perform any necessary recovery or cleanup manually."
      ));
      return 0;
    }

    if (isMergeCommand(command)) {
      emit(preToolDecision(
        "deny",
        "Merging is blocked by the SDLC policy. Agents raise the PR; a human merges it outside this workflow."
      ));
      return 0;
    }

    if (isGitMutation(command)) {
      emit(preToolDecision(
        "ask",
        "Git mutation requires explicit human confirmation under the SDLC policy."
      ));
      return 0;
    }
  }

  // MCP tool names generally have the form mcp__server__tool.
  if (toolName.startsWith("mcp__")) {
    if (/merge_pull_request|mergepullrequest/i.test(toolName)) {
      emit(preToolDecision(
        "deny",
        "Merging is blocked by the SDLC policy. Agents raise the PR; a human merges it outside this workflow."
      ));
      return 0;
    }

    const classification = classifyMcp(toolName);

    if (classification === "mutating") {
      emit(preToolDecision(
        "ask",
        "This MCP operation may change external state. Review its arguments and explicitly confirm before proceeding."
      ));
      return 0;
    }

    if (classification === "unknown") {
      emit(preToolDecision(
        "ask",
        "The SDLC hook cannot confidently classify this MCP operation as read-only. Review it before proceeding."
      ));
      return 0;
    }
  }

  // No decision: Claude Code's normal permission rules remain in force.
  return 0;
}

let raw = "";

process.stdin.setEncoding("utf8");

process.stdin.on("data", (chunk) => {
  raw += chunk;
});

process.stdin.on("end", () => {
  try {
    if (!raw.trim()) {
      process.stderr.write("SDLC policy: empty hook input.\n");
      process.exitCode = 2;
      return;
    }

    const input = JSON.parse(raw);
    process.exitCode = handle(input);
  } catch (error) {
    process.stderr.write(
      "SDLC policy: invalid input or policy error: " +
      String(error && error.message ? error.message : error) + "\n"
    );
    process.exitCode = 2;
  }
});
