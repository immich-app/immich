import {
  buildAutomaticReconciliationClaim,
  chooseAutomaticTargetIdentity,
  filterUnambiguousReconciliationClaims,
  type AutomaticReconciliationCandidate,
  type ReconciliationClaim,
} from 'src/services/accessible-identity-reconciliation';

const baseCandidate = (
  overrides: Partial<AutomaticReconciliationCandidate> = {},
): AutomaticReconciliationCandidate => ({
  bridge: 'member-join',
  localIdentityId: 'local-identity',
  spaceIdentityId: 'space-identity',
  sourceIdentityId: 'local-identity',
  targetIdentityId: 'space-identity',
  sourceProfileKey: 'user:member-1:local-person',
  targetProfileKey: 'space:space-1:space-person',
  distance: 0.2,
  hasAccessBridge: true,
  compatibleType: true,
  hasEmbedding: true,
  hiddenOrIgnored: false,
  alreadySameIdentity: false,
  sameOwnerConflict: false,
  sameSpaceConflict: false,
  ...overrides,
});

describe('accessible identity reconciliation policy', () => {
  it('builds one strict automatic claim when the candidate is compatible', () => {
    expect(buildAutomaticReconciliationClaim(baseCandidate())).toEqual({
      bridge: 'member-join',
      sourceIdentityId: 'local-identity',
      targetIdentityId: 'space-identity',
      sourceProfileKey: 'user:member-1:local-person',
      targetProfileKey: 'space:space-1:space-person',
      distance: 0.2,
    });
  });

  it.each([
    ['missing access bridge', { hasAccessBridge: false }],
    ['missing embedding', { hasEmbedding: false }],
    ['type mismatch', { compatibleType: false }],
    ['hidden profile', { hiddenOrIgnored: true }],
    ['already same identity', { alreadySameIdentity: true }],
    ['same owner conflict', { sameOwnerConflict: true }],
    ['same space conflict', { sameSpaceConflict: true }],
  ])('skips %s', (_name, overrides) => {
    expect(buildAutomaticReconciliationClaim(baseCandidate(overrides))).toBeUndefined();
  });

  it('keeps only one-to-one claims in a pass', () => {
    const claims: ReconciliationClaim[] = [
      {
        bridge: 'member-join',
        sourceIdentityId: 'source-1',
        targetIdentityId: 'target-1',
        sourceProfileKey: 'source-profile-1',
        targetProfileKey: 'target-profile-1',
      },
      {
        bridge: 'member-join',
        sourceIdentityId: 'source-2',
        targetIdentityId: 'target-2',
        sourceProfileKey: 'source-profile-2',
        targetProfileKey: 'target-profile-2',
      },
      {
        bridge: 'member-join',
        sourceIdentityId: 'source-2',
        targetIdentityId: 'target-3',
        sourceProfileKey: 'source-profile-2',
        targetProfileKey: 'target-profile-3',
      },
      {
        bridge: 'member-join',
        sourceIdentityId: 'source-4',
        targetIdentityId: 'target-1',
        sourceProfileKey: 'source-profile-4',
        targetProfileKey: 'target-profile-1',
      },
    ];

    expect(filterUnambiguousReconciliationClaims(claims)).toEqual([]);
  });

  it('keeps distinct one-to-one claims', () => {
    const claims: ReconciliationClaim[] = [
      {
        bridge: 'space-evidence',
        sourceIdentityId: 'source-1',
        targetIdentityId: 'target-1',
        sourceProfileKey: 'source-profile-1',
        targetProfileKey: 'target-profile-1',
      },
      {
        bridge: 'space-evidence',
        sourceIdentityId: 'source-2',
        targetIdentityId: 'target-2',
        sourceProfileKey: 'source-profile-2',
        targetProfileKey: 'target-profile-2',
      },
    ];

    expect(filterUnambiguousReconciliationClaims(claims)).toEqual(claims);
  });

  it('counts multiple profiles on the same identity as one candidate outside claim filtering', () => {
    const claims: ReconciliationClaim[] = [
      {
        bridge: 'personal-upload',
        sourceIdentityId: 'local-identity',
        targetIdentityId: 'shared-identity',
        sourceProfileKey: 'user:u1:p1',
        targetProfileKey: 'space:s1:sp1',
      },
    ];

    expect(filterUnambiguousReconciliationClaims(claims)).toEqual(claims);
  });

  it('drops target-to-multiple-source claims', () => {
    const claims: ReconciliationClaim[] = [
      {
        bridge: 'space-evidence',
        sourceIdentityId: 'source-1',
        targetIdentityId: 'target',
        sourceProfileKey: 'user:u1:p1',
        targetProfileKey: 'space:s1:sp1',
      },
      {
        bridge: 'space-evidence',
        sourceIdentityId: 'source-2',
        targetIdentityId: 'target',
        sourceProfileKey: 'user:u2:p2',
        targetProfileKey: 'space:s1:sp1',
      },
    ];

    expect(filterUnambiguousReconciliationClaims(claims)).toEqual([]);
  });

  it.each([
    ['member-join', 'local-identity', 'space-identity'],
    ['space-evidence', 'local-identity', 'space-identity'],
    ['personal-upload', 'local-identity', 'space-identity'],
    ['explicit-space-add', 'local-identity', 'space-identity'],
  ] as const)('chooses deterministic target for %s', (bridge, expectedSource, expectedTarget) => {
    expect(
      chooseAutomaticTargetIdentity({
        bridge,
        localIdentityId: 'local-identity',
        spaceIdentityId: 'space-identity',
      }),
    ).toEqual({ sourceIdentityId: expectedSource, targetIdentityId: expectedTarget });
  });

  it('uses stable id tie-breaker when neither side is preferred', () => {
    expect(
      chooseAutomaticTargetIdentity({
        bridge: 'manual-compatible',
        firstIdentityId: 'identity-b',
        secondIdentityId: 'identity-a',
      }),
    ).toEqual({ sourceIdentityId: 'identity-b', targetIdentityId: 'identity-a' });
  });
});
