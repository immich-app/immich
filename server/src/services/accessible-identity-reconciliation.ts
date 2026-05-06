export type ReconciliationBridge =
  | 'member-join'
  | 'space-evidence'
  | 'personal-upload'
  | 'explicit-space-add'
  | 'manual-compatible';

export type ReconciliationClaim = {
  bridge: ReconciliationBridge;
  sourceIdentityId: string;
  targetIdentityId: string;
  sourceProfileKey?: string;
  targetProfileKey?: string;
  distance?: number;
};

export type AutomaticReconciliationCandidate = {
  bridge: ReconciliationBridge;
  localIdentityId?: string;
  spaceIdentityId?: string;
  sourceIdentityId: string;
  targetIdentityId: string;
  sourceProfileKey?: string;
  targetProfileKey?: string;
  distance?: number;
  hasAccessBridge: boolean;
  compatibleType: boolean;
  hasEmbedding: boolean;
  hiddenOrIgnored: boolean;
  alreadySameIdentity: boolean;
  sameOwnerConflict: boolean;
  sameSpaceConflict: boolean;
};

export const chooseAutomaticTargetIdentity = (
  input:
    | {
        bridge: Exclude<ReconciliationBridge, 'manual-compatible'>;
        localIdentityId: string;
        spaceIdentityId: string;
      }
    | {
        bridge: 'manual-compatible';
        firstIdentityId: string;
        secondIdentityId: string;
      },
): { sourceIdentityId: string; targetIdentityId: string } => {
  if (input.bridge === 'manual-compatible') {
    const [targetIdentityId, sourceIdentityId] = [input.firstIdentityId, input.secondIdentityId].toSorted();
    return { sourceIdentityId, targetIdentityId };
  }

  return {
    sourceIdentityId: input.localIdentityId,
    targetIdentityId: input.spaceIdentityId,
  };
};

export const buildAutomaticReconciliationClaim = (
  candidate: AutomaticReconciliationCandidate,
): ReconciliationClaim | undefined => {
  if (
    !candidate.hasAccessBridge ||
    !candidate.compatibleType ||
    !candidate.hasEmbedding ||
    candidate.hiddenOrIgnored ||
    candidate.alreadySameIdentity ||
    candidate.sameOwnerConflict ||
    candidate.sameSpaceConflict
  ) {
    return;
  }

  return {
    bridge: candidate.bridge,
    sourceIdentityId: candidate.sourceIdentityId,
    targetIdentityId: candidate.targetIdentityId,
    sourceProfileKey: candidate.sourceProfileKey,
    targetProfileKey: candidate.targetProfileKey,
    distance: candidate.distance,
  };
};

export const filterUnambiguousReconciliationClaims = (claims: ReconciliationClaim[]): ReconciliationClaim[] => {
  const sourceCounts = new Map<string, number>();
  const targetCounts = new Map<string, number>();

  for (const claim of claims) {
    sourceCounts.set(claim.sourceIdentityId, (sourceCounts.get(claim.sourceIdentityId) ?? 0) + 1);
    targetCounts.set(claim.targetIdentityId, (targetCounts.get(claim.targetIdentityId) ?? 0) + 1);
  }

  return claims.filter(
    (claim) => sourceCounts.get(claim.sourceIdentityId) === 1 && targetCounts.get(claim.targetIdentityId) === 1,
  );
};
