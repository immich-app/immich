import micromatch from "micromatch";
import type {
  ClassifiedCommit,
  Domain,
  GitCommit,
  Manifest,
  RiskLevel,
} from "./types";

const riskRank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

export function detectDomain(file: string): Domain {
  if (file.startsWith("server/")) return "server";
  if (file.startsWith("web/")) return "web";
  if (file.startsWith("mobile/")) return "mobile";
  if (file.startsWith(".github/")) return "ci";
  if (file.startsWith("docs/")) return "docs";
  if (file.startsWith("e2e/")) return "e2e";
  if (file.startsWith("machine-learning/")) return "ml";
  return "config";
}

function maxRisk(left: RiskLevel, right: RiskLevel): RiskLevel {
  return riskRank[right] > riskRank[left] ? right : left;
}

function checkAppliesToCommit(
  checkRisk: RiskLevel,
  commitRisk: RiskLevel,
): boolean {
  return riskRank[commitRisk] >= riskRank[checkRisk];
}

export function classifyCommit(
  commit: GitCommit,
  manifest: Manifest,
  forkFiles: string[],
): ClassifiedCommit {
  const domains = [...new Set(commit.files.map(detectDomain))].sort();
  const overlapFiles = commit.files.filter((file) => forkFiles.includes(file));
  const features = new Set<string>();
  const requiredChecks = new Set<string>();
  const reasons: string[] = [];
  let risk: RiskLevel = overlapFiles.length > 0 ? "medium" : "low";

  for (const [featureId, feature] of Object.entries(manifest.features)) {
    const ownedMatch = micromatch(commit.files, feature.owned_paths ?? []);
    const extensionMatch = micromatch(
      commit.files,
      feature.upstream_extension_paths ?? [],
    );

    if (ownedMatch.length > 0 || extensionMatch.length > 0) {
      features.add(featureId);
      risk = maxRisk(risk, feature.risk);
      for (const check of feature.required_checks ?? [])
        requiredChecks.add(check);
    }

    if (ownedMatch.length > 0) reasons.push(`Touches ${featureId} owned path`);
    if (extensionMatch.length > 0)
      reasons.push(`Touches ${featureId} upstream extension path`);
  }

  for (const pattern of manifest.risk_patterns ?? []) {
    const subjectMatches = pattern.subject_regex
      ? new RegExp(pattern.subject_regex).test(commit.subject)
      : false;
    const pathMatches = pattern.path_globs
      ? micromatch(commit.files, pattern.path_globs).length > 0
      : false;

    if (subjectMatches || pathMatches) {
      risk = maxRisk(risk, pattern.risk);
      reasons.push(`Matches risk pattern ${pattern.id}`);
    }
  }

  for (const [checkId, check] of Object.entries(manifest.checks ?? {})) {
    if (
      check.required_for_risk?.some((checkRisk) =>
        checkAppliesToCommit(checkRisk, risk),
      )
    ) {
      requiredChecks.add(checkId);
    }
    if (
      check.required_for_domains?.some((domain) => domains.includes(domain))
    ) {
      requiredChecks.add(checkId);
    }
  }

  return {
    ...commit,
    domains,
    overlapFiles,
    features: [...features].sort(),
    risk,
    reasons,
    requiredChecks: [...requiredChecks].sort(),
  };
}
