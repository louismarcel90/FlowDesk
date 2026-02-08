import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const OPA_URL = process.env.OPA_URL ?? 'http://localhost:8181';
const POLICIES_DIR = join(process.cwd(), 'policies');

async function putPolicy(id: string, rego: string) {
  const res = await fetch(`${OPA_URL}/v1/policies/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'content-type': 'text/plain' },
    body: rego
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OPA policy push failed (${id}): ${res.status} ${t}`);
  }
}

async function main() {
  const files = (await readdir(POLICIES_DIR)).filter((f) => f.endsWith('.rego') && !f.endsWith('_test.rego'));
  files.sort((a, b) => a.localeCompare(b));

  for (const f of files) {
    const id = `flowdesk/${f.replace('.rego', '')}`;
    const content = await readFile(join(POLICIES_DIR, f), 'utf8');
    await putPolicy(id, content);
    // eslint-disable-next-line no-console
    console.log(`[policy:push] loaded ${id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
