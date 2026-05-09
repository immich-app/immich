import fs from 'node:fs';
import path from 'node:path';
import micromatch from 'micromatch';
import type { AuditResult, CiInvariant, Manifest } from '../types';

export type TextFile = { path: string; text: string };

export function checkCiInvariantText(
  invariant: CiInvariant,
  files: TextFile[],
): AuditResult {
  const details: string[] = [];
  const matchedFiles = files.filter((file) =>
    micromatch.isMatch(file.path, invariant.paths, { dot: true }),
  );

  for (const file of matchedFiles) {
    if (
      invariant.exceptions &&
      micromatch.isMatch(file.path, invariant.exceptions, { dot: true })
    ) {
      continue;
    }
    for (const pattern of invariant.forbidden_patterns) {
      if (file.text.includes(pattern)) {
        details.push(`${file.path} contains forbidden pattern ${pattern}`);
      }
    }
  }

  return {
    ok: details.length === 0,
    title: invariant.title,
    details: details.length > 0 ? details : [`${invariant.id} passed`],
  };
}

export function runCiInvariantAudits(
  manifest: Manifest,
  cwd = process.cwd(),
): AuditResult[] {
  const workflowRoot = path.join(cwd, '.github/workflows');
  const files = fs.existsSync(workflowRoot)
    ? fs
        .readdirSync(workflowRoot)
        .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
        .map((file) => ({
          path: `.github/workflows/${file}`,
          text: fs.readFileSync(path.join(workflowRoot, file), 'utf8'),
        }))
    : [];

  return (manifest.ci_invariants ?? []).map((invariant) =>
    checkCiInvariantText(invariant, files),
  );
}
