import { readFile, readdir } from "node:fs/promises";
import { join, resolve, basename } from "node:path";

const OPA_URL = process.env.OPA_URL ?? "http://localhost:8181";

// repo root = apps/policy -> remonte de 2 niveaux
const REPO_ROOT = resolve(process.cwd(), "..", "..");

// sources à pousser
const POLICY_DIRS = [
  resolve(REPO_ROOT, "infra", "policies"),
  resolve(REPO_ROOT, "apps", "policy", "policies"),
];

  // Clean old flowdesk policies to avoid rule collisions
  const existing = await listPolicyIds();
  for (const id of existing) {
    if (id.startsWith("flowdesk/")) {
      await deletePolicy(id);
      console.log(`[policy:push] deleted ${id}`);
    }
  }


async function putPolicy(id: string, rego: string) {
  const res = await fetch(`${OPA_URL}/v1/policies/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "text/plain" },
    body: rego,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OPA policy push failed (${id}): ${res.status} ${t}`);
  }
}

function isPolicyFile(f: string) {
  // on push uniquement les .rego, pas les tests
  return f.endsWith(".rego") && !f.endsWith("_test.rego") && !f.endsWith(".test.rego");
}

async function listPolicyIds(): Promise<string[]> {
  const res = await fetch(`${OPA_URL}/v1/policies`);
  if (!res.ok) throw new Error(`OPA list policies failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { result?: Array<{ id: string }> };
  return (json.result ?? []).map((p) => p.id);
}

async function deletePolicy(id: string) {
  const res = await fetch(`${OPA_URL}/v1/policies/${encodeURIComponent(id)}`, { method: "DELETE" });

  if (res.status === 404) return; // ok

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OPA delete policy failed (${id}): ${res.status} ${t}`);
  }
}



// 2) Delete everything in OPA in the right order:
//    - delete apps_* first (they import infra lib)
//    - then delete infra_*
async function deleteAppsPoliciesOnly() {
  const ids = await listPolicyIds();

  const appsIds = ids
    .filter((id) => id.includes("apps_") || id.includes("apps_policy_"))
    .sort((a, b) => a.localeCompare(b));

  for (const id of appsIds) {
    await deletePolicy(id);
    console.log(`[policy:push] deleted ${id}`);
  }
}

async function main() {
  await deleteAppsPoliciesOnly();
  // collect files from both dirs
  const entries: Array<{ dir: string; file: string }> = [];

  for (const dir of POLICY_DIRS) {
    const files = await readdir(dir);
    for (const file of files) {
      if (isPolicyFile(file)) entries.push({ dir, file });
    }
  }

  // stable order
entries.sort((a, b) => {
  const aIsInfra = a.dir.includes(`${join("infra", "policies")}`);
  const bIsInfra = b.dir.includes(`${join("infra", "policies")}`);

  if (aIsInfra !== bIsInfra) return aIsInfra ? -1 : 1; // infra first
  return (a.dir + "/" + a.file).localeCompare(b.dir + "/" + b.file);
});

  for (const { dir, file } of entries) {
    const dirTag =
      dir.includes(`${join("apps", "policy", "policies")}`) ? "apps_policy" : "infra";

    const base = basename(file, ".rego");
    const id = `flowdesk/${dirTag}_${base}`;

    const content = await readFile(join(dir, file), "utf8");
    await putPolicy(id, content);

    // eslint-disable-next-line no-console
    console.log(`[policy:push] loaded ${id} (${dir}\\${file})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
