import { DateTime } from 'luxon';
import { AssetOrderWithRandom, MemoryType } from 'src/enum';
import { AssetRepository, MemoryLocationCluster } from 'src/repositories/asset.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { MemoryRule, MemoryRuleCandidate, MemoryRuleContext } from 'src/services/memory-rules/memory-rule.interface';

export class RecentTripMemoryRule implements MemoryRule {
  readonly id = 'recent_trip';
  private static readonly HOME_DOMINANCE_RATIO = 1.25;

  constructor(
    private assetRepository: Pick<AssetRepository, 'getMemoryLocationClusters' | 'getMemoryAssetsForLocation'>,
    private memoryRepository: Pick<MemoryRepository, 'search'>,
  ) {}

  async evaluate({ ownerId, target }: MemoryRuleContext): Promise<MemoryRuleCandidate[]> {
    const recentFrom = target.minus({ days: 30 }).startOf('day');
    const baselineFrom = recentFrom.minus({ days: 90 });
    const baselineTo = recentFrom.minus({ days: 1 }).endOf('day');

    const [baseline, recent, recentRuleMemories] = await Promise.all([
      this.assetRepository.getMemoryLocationClusters(ownerId, {
        takenAfter: baselineFrom.toJSDate(),
        takenBefore: baselineTo.toJSDate(),
      }),
      this.assetRepository.getMemoryLocationClusters(ownerId, {
        takenAfter: recentFrom.toJSDate(),
        takenBefore: target.endOf('day').toJSDate(),
      }),
      this.memoryRepository.search(ownerId, {
        type: MemoryType.Rule,
        size: 20,
        order: AssetOrderWithRandom.Desc,
      }),
    ]);

    const [home, runnerUp] = baseline;
    if (!home?.country) {
      return [];
    }

    const isAmbiguousHome =
      !!runnerUp &&
      runnerUp.country !== home.country &&
      runnerUp.assetCount >= home.assetCount / RecentTripMemoryRule.HOME_DOMINANCE_RATIO;
    if (isAmbiguousHome) {
      return [];
    }

    const candidate = recent.find((item) => this.isTripCandidate(item, home));
    if (!candidate) {
      return [];
    }

    if (!candidate.country) {
      return [];
    }

    const placeKey = `${candidate.country}:${candidate.city ?? ''}`.toLowerCase();
    const isCoolingDown = recentRuleMemories.some((memory) => {
      const data = memory.data as Record<string, unknown>;
      if (data.ruleId !== this.id) {
        return false;
      }

      const context = data.context as Record<string, unknown> | undefined;
      const seenPlaceKey = typeof context?.placeKey === 'string' ? context.placeKey : undefined;
      return seenPlaceKey === placeKey && DateTime.fromJSDate(memory.memoryAt) >= target.minus({ days: 30 });
    });

    if (isCoolingDown) {
      return [];
    }

    const locationAssets = await this.assetRepository.getMemoryAssetsForLocation(ownerId, {
      country: candidate.country,
      city: candidate.city,
      takenAfter: recentFrom.toJSDate(),
      takenBefore: target.endOf('day').toJSDate(),
    });
    const assetIds = locationAssets.map(({ id }) => id);

    const placeLabel = candidate.city ? `${candidate.city}, ${candidate.country}` : candidate.country;
    const dedupeDay = target.toFormat('yyyy-MM-dd');

    return [
      {
        ruleId: this.id,
        dedupeKey: `recent_trip:${placeKey}:${dedupeDay}`,
        title: `Recent trip to ${placeLabel}`,
        subtitle: `${candidate.assetCount} photos over ${candidate.dayCount} days`,
        score: 50 + candidate.dayCount * 5 + Math.min(candidate.assetCount, 20),
        assetIds,
        memoryAt: target,
        context: {
          placeKey,
          placeLabel,
          country: candidate.country,
          city: candidate.city,
          assetCount: candidate.assetCount,
          dayCount: candidate.dayCount,
          tripWindowStart: candidate.firstDate.toISOString(),
          tripWindowEnd: candidate.lastDate.toISOString(),
        },
      },
    ];
  }

  private isTripCandidate(item: MemoryLocationCluster, home: MemoryLocationCluster) {
    if (item.assetCount < 7 || item.dayCount < 2) {
      return false;
    }

    if (item.country !== home.country) {
      return true;
    }

    return !!home.city && !!item.city && item.city !== home.city;
  }
}
