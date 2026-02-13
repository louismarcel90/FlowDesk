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

// -------------------- OPA helpers --------------------

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
  if (!res.ok) {
    throw new Error(`OPA list policies failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { result?: Array<{ id: string }> };
  return (json.result ?? []).map((p) => p.id);
}

async function readPolicyRaw(id: string): Promise<string | null> {
  const res = await fetch(`${OPA_URL}/v1/policies/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`OPA read policy failed (${id}): ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { result?: { raw?: string } };
  return json.result?.raw ?? null;
}

async function deletePolicy(id: string) {
  const res = await fetch(`${OPA_URL}/v1/policies/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (res.status === 404) return; // ok

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OPA delete policy failed (${id}): ${res.status} ${t}`);
  }
}

async function deleteFlowdeskPolicies() {
  const ids = await listPolicyIds();

  // 1) purge classique: tout flowdesk/*
  const flowdesk = ids.filter((id) => id.startsWith("flowdesk/"));

  const isAppsPolicy = (id: string) => id.includes("apps_") || id.includes("apps_policy_");
  const isInfraPolicy = (id: string) => id.includes("infra_");

  const apps = flowdesk.filter(isAppsPolicy).sort((a, b) => a.localeCompare(b));
  const infra = flowdesk.filter(isInfraPolicy).sort((a, b) => a.localeCompare(b));
  const other = flowdesk
    .filter((id) => !isAppsPolicy(id) && !isInfraPolicy(id))
    .sort((a, b) => a.localeCompare(b));

  for (const id of [...apps, ...infra, ...other]) {
    await deletePolicy(id);
    console.log(`[policy:push] deleted ${id}`);
  }

  // 2) purge "anti-fantôme": supprimer toute policy (même hors flowdesk/*)
  //    qui définit package flowdesk.authz + default allow
  const suspects = ids.filter((id) => !id.startsWith("flowdesk/") && id.toLowerCase().includes("authz"));

  for (const id of suspects) {
    const raw = await readPolicyRaw(id);
    if (!raw) continue;

    const hasPkg = /\bpackage\s+flowdesk\.authz\b/.test(raw);
    const hasDefaultAllow = /^\s*default\s+allow\s*(:=|=)/m.test(raw);

    if (hasPkg && hasDefaultAllow) {
      await deletePolicy(id);
      console.log(`[policy:push] deleted ghost default allow policy ${id}`);
    }
  }
}

// -------------------- main --------------------

async function main() {
  // purge the whole flowdesk/* to avoid collisions (anciens infra_* restants)
  await deleteFlowdeskPolicies();

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
    const dirTag = dir.includes(`${join("apps", "policy", "policies")}`) ? "apps_policy" : "infra";
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

