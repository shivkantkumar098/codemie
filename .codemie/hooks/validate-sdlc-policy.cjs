
"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const POLICY = path.join(
  REPO_ROOT,
  ".codemie",
  "hooks",
  "sdlc-policy.cjs"
);

const results = [];

function runHook(input) {
  const result = spawnSync(process.execPath, [POLICY], {
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
    timeout: 5000,
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }

  let output = null;

  if (result.stdout && result.stdout.trim()) {
    output = JSON.parse(result.stdout);
  }

  return {
    code: result.status,
    output,
    stderr: result.stderr || ""
  };
}

function test(name, fn) {
  try {
    const detail = fn();
    results.push({ name, passed: true, detail: detail || "" });
  } catch (error) {
    results.push({
      name,
      passed: false,
      detail: error.message || String(error)
    });
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDecision(input, expected, reason) {
  const result = runHook(input);

  assertEqual(result.code, 0, "Hook exit code");

  const actual =
    result.output?.hookSpecificOutput?.permissionDecision ?? null;

  assertEqual(actual, expected, "Permission decision");

  if (reason) {
    const actualReason =
      result.output?.hookSpecificOutput?.permissionDecisionReason || "";

    if (!actualReason.includes(reason)) {
      throw new Error(`Expected reason to contain: ${reason}`);
    }
  }
}

function main() {
  if (!require("node:fs").existsSync(POLICY)) {
    console.error("Missing Claude Code policy:", POLICY);
    process.exit(1);
  }

  test("static: hook syntax", () => {
    const result = spawnSync(
      process.execPath,
      ["--check", POLICY],
      { encoding: "utf8", timeout: 5000 }
    );

    assertEqual(result.status, 0, "node --check");
    return "Syntax valid";
  });

  test("sessionStart: adds workflow context", () => {
    const result = runHook({
      hook_event_name: "SessionStart",
      session_id: "test-session",
      source: "startup"
    });

    assertEqual(result.code, 0, "Hook exit code");

    const specific = result.output?.hookSpecificOutput;

    assertEqual(
      specific?.hookEventName,
      "SessionStart",
      "Event name"
    );

    if (!String(specific?.additionalContext || "").includes("human approval")) {
      throw new Error("Expected workflow approval guidance");
    }

    return "Context provided";
  });

  test("PreToolUse: ordinary source edit stays with normal permissions", () => {
    assertDecision({
      hook_event_name: "PreToolUse",
      tool_name: "Write",
      tool_input: {
        file_path: "src/example.js",
        content: "example"
      }
    }, null);

    return "No hook decision; normal permissions apply";
  });

  test("PreToolUse: protected hook file denied", () => {
    assertDecision({
      hook_event_name: "PreToolUse",
      tool_name: "Write",
      tool_input: {
        file_path: ".codemie/hooks/sdlc-policy.cjs",
        content: "replacement"
      }
    }, "deny", "Protected workflow configuration");

    return "Protected file blocked";
  });

  test("PreToolUse: .mcp.json edit denied", () => {
    assertDecision({
      hook_event_name: "PreToolUse",
      tool_name: "Edit",
      tool_input: {
        file_path: ".mcp.json",
        old_string: "old",
        new_string: "new"
      }
    }, "deny");

    return "MCP configuration protected";
  });

  test("PreToolUse: destructive shell command denied", () => {
    assertDecision({
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: {
        command: "rm -rf .codemie/hooks"
      }
    }, "deny", "Destructive command blocked");

    return "Destructive command blocked";
  });

  test("PreToolUse: Git push requires confirmation", () => {
    assertDecision({
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: {
        command: "git push origin feature/test"
      }
    }, "ask", "explicit human confirmation");

    return "Confirmation requested";
  });

  test("PreToolUse: mutating Jira MCP operation requires confirmation", () => {
    assertDecision({
      hook_event_name: "PreToolUse",
      tool_name: "mcp__jira__create_issue",
      tool_input: {
        project: "TEST"
      }
    }, "ask", "change external state");

    return "Confirmation requested";
  });

  test("PreToolUse: unknown MCP operation requires confirmation", () => {
    assertDecision({
      hook_event_name: "PreToolUse",
      tool_name: "mcp__custom__perform_action",
      tool_input: {}
    }, "ask", "cannot confidently classify");

    return "Unknown operation not silently approved";
  });

  test("PreToolUse: recognized read-only MCP operation stays with normal permissions", () => {
    assertDecision({
      hook_event_name: "PreToolUse",
      tool_name: "mcp__jira__getIssue",
      tool_input: {
        issue_key: "TEST-1"
      }
    }, null);

    return "No hook decision; normal permissions apply";
  });

  test("invalid JSON fails closed", () => {
    const result = runHook("{invalid-json");

    assertEqual(result.code, 2, "Exit code");
    return "Malformed input rejected";
  });

  test("missing event fails closed", () => {
    const result = runHook({
      session_id: "test-session"
    });

    assertEqual(result.code, 2, "Exit code");
    return "Missing event rejected";
  });

  for (const result of results) {
    console.log(
      `${result.passed ? "PASS" : "FAIL"} ${result.name}` +
      (result.detail ? ` — ${result.detail}` : "")
    );
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  console.log(`\nSummary: ${passed}/${results.length} passed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
