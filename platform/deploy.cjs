"use strict";
// Deploys the generated CM-SDLC assistants and workflow to the CodeMie platform.
// Usage:
//   node platform/deploy.cjs integrations <env-file>   create/update the Jira integration (reads secrets from env-file)
//   node platform/deploy.cjs assistants                create/update the 9 assistants
//   node platform/deploy.cjs workflow                  create/update the pipeline workflow
// Secrets are only passed through a temp file that is deleted immediately; nothing is printed or stored.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const PROJECT = "shivkant_kumar@epam.com";
const JIRA_URL = "https://shivkantkr.atlassian.net/";
const JIRA_ALIAS = "cm-sdlc-jira";
const GIT_URL = "https://github.com/shivkantkumar098/codemie";
const GIT_ALIAS = "cm-sdlc-github";
const WORKFLOW_NAME = "CM-SDLC Pipeline";
const GEN = path.join(__dirname, "generated");

function cli(args) {
  const r = spawnSync("codemie", args, { encoding: "utf8", shell: true });
  if (r.status !== 0) {
    const err = `${r.stdout || ""}${r.stderr || ""}`.split(/\r?\n/).filter((l) => !/ExperimentalWarning|trace-warnings/.test(l)).join("\n");
    throw new Error(`codemie ${args.slice(0, 3).join(" ")} failed:\n${err}`);
  }
  return r.stdout || "";
}

function cliJson(args) {
  const out = cli([...args, "--json"]);
  const lines = out.split(/\r?\n/);
  const start = lines.findIndex((l) => /^[[{]/.test(l));
  return JSON.parse(lines.slice(start).join("\n"));
}

function withTempJson(obj, fn) {
  const file = path.join(os.tmpdir(), `cm-sdlc-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(obj), { mode: 0o600 });
  try {
    return fn(file.replace(/\\/g, "/"));
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function parseEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function integrations(envFile) {
  const env = parseEnv(envFile);
  for (const k of ["JIRA_USERNAME", "JIRA_API_TOKEN"]) if (!env[k]) throw new Error(`${k} missing in env file`);
  const payload = {
    credential_type: "Jira",
    project_name: PROJECT,
    alias: JIRA_ALIAS,
    setting_type: "user",
    credential_values: [
      { key: "url", value: JIRA_URL },
      { key: "username", value: env.JIRA_USERNAME },
      { key: "token", value: env.JIRA_API_TOKEN },
      { key: "is_cloud", value: "true" },
      { key: "alias", value: JIRA_ALIAS },
    ],
  };
  const existing = cliJson(["sdk", "integrations", "list", "--setting-type", "user", "--search", JIRA_ALIAS]).find((i) => i.alias === JIRA_ALIAS);
  if (existing) {
    withTempJson(payload, (f) => cli(["sdk", "integrations", "update", existing.id, "--json", f]));
    console.log(`Updated Jira integration '${JIRA_ALIAS}'.`);
  } else {
    withTempJson(payload, (f) => cli(["sdk", "integrations", "create", "--json", f]));
    console.log(`Created Jira integration '${JIRA_ALIAS}'.`);
  }
  upsertIntegration({
    credential_type: "Git",
    project_name: PROJECT,
    alias: GIT_ALIAS,
    setting_type: "user",
    credential_values: [
      { key: "url", value: GIT_URL },
      { key: "token", value: requireEnv(env, "GITHUB_PAT") },
      { key: "alias", value: GIT_ALIAS },
    ],
  });
}

function requireEnv(env, k) {
  if (!env[k]) throw new Error(`${k} missing in env file`);
  return env[k];
}

function upsertIntegration(payload) {
  const existing = cliJson(["sdk", "integrations", "list", "--setting-type", "user", "--search", payload.alias]).find((i) => i.alias === payload.alias);
  withTempJson(payload, (f) => cli(["sdk", "integrations", existing ? "update" : "create", ...(existing ? [existing.id] : []), "--json", f]));
  console.log(`${existing ? "Updated" : "Created"} ${payload.credential_type} integration '${payload.alias}'.`);
}

function expandToolkits(specs, catalog) {
  return specs.map((spec) => {
    const tk = catalog.find((t) => t.toolkit === spec.toolkit);
    if (!tk) throw new Error(`Toolkit not found on platform: ${spec.toolkit}`);
    const tools = tk.tools.filter((t) => spec.tools.includes(t.name));
    const missing = spec.tools.filter((n) => !tools.some((t) => t.name === n));
    if (missing.length) throw new Error(`Tools not found in ${spec.toolkit}: ${missing.join(", ")}`);
    return { ...tk, tools };
  });
}

function findByName(kind, name) {
  return cliJson(["sdk", kind, "list", "--search", `"${name}"`, "--projects", PROJECT]).find((a) => a.name === name);
}

function assistants() {
  const catalog = cliJson(["sdk", "assistants", "get-tools"]);
  const files = fs.readdirSync(path.join(GEN, "assistants")).sort();
  const ids = {};
  const upsert = (def, extra = {}) => {
    const { sub_assistants, ...rest } = def;
    const payload = { ...rest, ...extra, project: PROJECT, toolkits: expandToolkits(def.toolkits, catalog), skip_integration_validation: true };
    const existing = findByName("assistants", def.name);
    withTempJson(payload, (f) => (existing ? cli(["sdk", "assistants", "update", existing.id, "--json", f]) : cli(["sdk", "assistants", "create", "--json", f])));
    const id = (existing || findByName("assistants", def.name))?.id;
    if (!id) throw new Error(`Could not resolve id for ${def.name}`);
    ids[def.name] = id;
    console.log(`${existing ? "Updated" : "Created"} ${def.name} (${id})`);
  };
  // Stage assistants first so the orchestrator can reference them.
  for (const f of files.filter((x) => !x.startsWith("0-"))) upsert(JSON.parse(fs.readFileSync(path.join(GEN, "assistants", f), "utf8")));
  const orch = JSON.parse(fs.readFileSync(path.join(GEN, "assistants", "0-orchestrator.json"), "utf8"));
  upsert(orch, { assistant_ids: orch.sub_assistants.map((n) => ids[n]) });
  fs.writeFileSync(path.join(GEN, "assistant-ids.json"), JSON.stringify(ids, null, 2));
}

function workflow() {
  const ids = JSON.parse(fs.readFileSync(path.join(GEN, "assistant-ids.json"), "utf8"));
  const names = Object.keys(ids).filter((n) => !n.includes(" 0 ")).sort();
  let yaml = fs.readFileSync(path.join(GEN, "workflow.yaml.tmpl"), "utf8");
  names.forEach((n, i) => (yaml = yaml.replace(`{{ASSISTANT_ID_${i + 1}}}`, ids[n])));
  const yamlFile = path.join(GEN, "workflow.yaml");
  fs.writeFileSync(yamlFile, yaml);
  const meta = {
    name: WORKFLOW_NAME,
    project: PROJECT,
    mode: "Sequential",
    shared: false,
    description: "Jira-driven 8-stage Agentic SDLC with human approval (interrupt_before) between stages.",
  };
  const existing = findByName("workflows", WORKFLOW_NAME);
  withTempJson(meta, (f) =>
    existing
      ? cli(["sdk", "workflows", "update", existing.id, "--json", f, "--config", yamlFile.replace(/\\/g, "/")])
      : cli(["sdk", "workflows", "create", "--json", f, "--config", yamlFile.replace(/\\/g, "/")]),
  );
  const wf = findByName("workflows", WORKFLOW_NAME);
  console.log(`${existing ? "Updated" : "Created"} workflow '${WORKFLOW_NAME}' (${wf?.id})`);
}

const [cmd, arg] = process.argv.slice(2);
const commands = { integrations: () => integrations(arg), assistants, workflow };
if (!commands[cmd]) {
  console.error("Usage: node platform/deploy.cjs <integrations <env-file>|assistants|workflow>");
  process.exit(1);
}
try {
  commands[cmd]();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
