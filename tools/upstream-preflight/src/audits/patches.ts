import fs from 'node:fs';
import path from 'node:path';
import type { AuditResult, Manifest, PackagePatch } from '../types';

export function checkPackagePatchText(
  patch: PackagePatch,
  sourceText: string,
  existingPatchFiles: string[],
): AuditResult {
  const details: string[] = [];

  if (!sourceText.includes(patch.expected_patch)) {
    details.push(
      `${patch.version_source} does not reference ${patch.expected_patch}`,
    );
  }

  if (!existingPatchFiles.includes(patch.expected_patch)) {
    details.push(`Missing patch file ${patch.expected_patch}`);
  }

  return {
    ok: details.length === 0,
    title: `Patch check: ${patch.package}`,
    details:
      details.length > 0
        ? details
        : [`${patch.package} patch metadata is consistent`],
  };
}

export function runPatchAudits(
  manifest: Manifest,
  cwd = process.cwd(),
): AuditResult[] {
  const patchFiles = listPatchFiles(path.join(cwd, 'patches')).map(
    (file) => `patches/${file}`,
  );

  return (manifest.patches ?? []).map((patch) => {
    const sourcePath = path.join(cwd, patch.version_source);
    const sourceText = fs.existsSync(sourcePath)
      ? fs.readFileSync(sourcePath, 'utf8')
      : '';
    return checkPackagePatchText(patch, sourceText, patchFiles);
  });
}

function listPatchFiles(patchRoot: string): string[] {
  if (!fs.existsSync(patchRoot)) {
    return [];
  }

  return fs
    .readdirSync(patchRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}
