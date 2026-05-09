import fs from 'node:fs';
import path from 'node:path';
import type {
  AuditResult,
  CoverageClassification,
  ManifestHeadValidation,
} from './types';

export type ReadinessResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  plannedResolutions: string[];
  reportPaths: string[];
};

export type ReadinessEvaluationInput = {
  uncoveredFiles?: string[];
  headValidation?: ManifestHeadValidation;
  broadOptionalOnly?: CoverageClassification[];
  ciResults?: AuditResult[];
  patchResults?: AuditResult[];
  postRebaseAuditResults?: AuditResult[];
  planningResults?: AuditResult[];
  batchPlanError?: string;
  reportPaths?: string[];
};

const currentForkBlockerAuditTitles = new Set([
  'Fork-Owned File Survival',
  'Fork Extension Symbol Survival',
  'Gallery Migration Count',
  'Gallery Migration Filename Survival',
  'Gallery Migration Manifest Coverage',
]);

const plannedResolutionAuditTitles = new Set([
  'Mobile Drift Migration Check',
  'Migration Timestamp Collision Check',
  'Generated Artifact Review',
]);

export function evaluateReadiness(
  input: ReadinessEvaluationInput,
): ReadinessResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const plannedResolutions: string[] = [];

  if (input.batchPlanError) {
    errors.push(`Batch plan generation failed: ${input.batchPlanError}`);
  }

  if ((input.uncoveredFiles ?? []).length > 0) {
    errors.push(
      `Ownership manifest does not cover ${input.uncoveredFiles?.length ?? 0} fork files:`,
      ...(input.uncoveredFiles ?? []),
    );
  }

  errors.push(...(input.headValidation?.errors ?? []));
  warnings.push(...(input.headValidation?.warnings ?? []));

  for (const classification of input.broadOptionalOnly ?? []) {
    warnings.push(
      `Broad optional coverage: ${classification.file} is covered only by ${classification.broadOptionalGlobs.join(', ')}. Add a narrower owned path or upstream extension path when reconciling the manifest.`,
    );
  }

  appendFailedAudits(errors, input.ciResults ?? []);
  appendFailedAudits(errors, input.patchResults ?? []);

  for (const audit of input.postRebaseAuditResults ?? []) {
    if (audit.ok) continue;
    if (currentForkBlockerAuditTitles.has(audit.title)) {
      appendAudit(errors, audit);
    } else if (plannedResolutionAuditTitles.has(audit.title)) {
      appendAudit(plannedResolutions, audit);
    } else {
      appendAudit(errors, audit);
    }
  }

  for (const audit of input.planningResults ?? []) {
    if (!audit.ok) {
      appendAudit(plannedResolutions, audit);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    plannedResolutions,
    reportPaths: input.reportPaths ?? [],
  };
}

export function readinessExitCode(result: ReadinessResult): number {
  return result.ok ? 0 : 1;
}

export function renderReadinessMarkdown(result: ReadinessResult): string {
  return `# Upstream Rebase Readiness

- **Status**: ${result.ok ? 'READY' : 'BLOCKED'}

## Blockers

${renderList(result.errors, 'None')}

## Warnings

${renderList(result.warnings, 'None')}

## Planned Resolutions

${renderList(result.plannedResolutions, 'None')}

## Reports

${renderList(result.reportPaths, 'None')}
`;
}

export function writeReadinessReports(
  outputDir: string,
  result: ReadinessResult,
) {
  fs.mkdirSync(outputDir, { recursive: true });
  const markdownPath = path.join(outputDir, 'readiness.md');
  const jsonPath = path.join(outputDir, 'readiness.json');
  const resultWithPaths = {
    ...result,
    reportPaths: [...new Set([...result.reportPaths, markdownPath, jsonPath])],
  };

  fs.writeFileSync(markdownPath, renderReadinessMarkdown(resultWithPaths));
  fs.writeFileSync(jsonPath, `${JSON.stringify(resultWithPaths, null, 2)}\n`);

  return { result: resultWithPaths, markdownPath, jsonPath };
}

function appendFailedAudits(output: string[], audits: AuditResult[]) {
  for (const audit of audits) {
    if (!audit.ok) appendAudit(output, audit);
  }
}

function appendAudit(output: string[], audit: AuditResult) {
  output.push(`${audit.title}:`);
  output.push(...audit.details.map((detail) => `- ${detail}`));
}

function renderList(items: string[], emptyText: string) {
  return items.length > 0
    ? items
        .map((item) => (item.startsWith('- ') ? `  ${item}` : `- ${item}`))
        .join('\n')
    : `- ${emptyText}`;
}
