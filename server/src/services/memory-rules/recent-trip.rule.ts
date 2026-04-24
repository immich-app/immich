import { DateTime } from 'luxon';
import { AssetOrderWithRandom, MemoryType } from 'src/enum';
import { AssetRepository, MemoryAsset, MemoryLocationCluster } from 'src/repositories/asset.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { MemoryRule, MemoryRuleCandidate, MemoryRuleContext } from 'src/services/memory-rules/memory-rule.interface';

export class RecentTripMemoryRule implements MemoryRule {
  readonly id = 'recent_trip';
  private static readonly HOME_DOMINANCE_RATIO = 1.25;
  private static readonly BURST_WINDOW_MS = 2 * 60 * 1000;
  private static readonly SMALL_TRIP_MAX = 6;

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
    const assetIds = this.curateTripAssets(locationAssets);

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

  private curateTripAssets(assets: MemoryAsset[]): string[] {
    const representatives = this.collapseBurstAssets(assets);
    if (representatives.length <= RecentTripMemoryRule.SMALL_TRIP_MAX) {
      return representatives.map(({ id }) => id);
    }

    const dayBuckets = this.groupAssetsByDay(representatives);
    const targetSize = this.getTripTargetSize(dayBuckets.length, representatives.length);
    const selected = this.pickDayCoverage(dayBuckets, targetSize);
    const selectedIds = new Set(selected.map(({ id }) => id));

    if (selected.length < targetSize) {
      const remaining = representatives.filter(({ id }) => !selectedIds.has(id));
      selected.push(...this.pickEvenlySpaced(remaining, targetSize - selected.length));
    }

    return [...selected]
      .toSorted((left, right) => left.localDateTime.getTime() - right.localDateTime.getTime())
      .map(({ id }) => id);
  }

  private collapseBurstAssets(assets: MemoryAsset[]): MemoryAsset[] {
    const representatives: MemoryAsset[] = [];
    let previous: MemoryAsset | undefined;

    for (const asset of assets) {
      if (
        !previous ||
        asset.localDateTime.getTime() - previous.localDateTime.getTime() > RecentTripMemoryRule.BURST_WINDOW_MS
      ) {
        representatives.push(asset);
      }
      previous = asset;
    }

    return representatives;
  }

  private groupAssetsByDay(assets: MemoryAsset[]): MemoryAsset[][] {
    const byDay = new Map<string, MemoryAsset[]>();

    for (const asset of assets) {
      const dayKey = DateTime.fromJSDate(asset.localDateTime, { zone: 'utc' }).toISODate();
      const dayAssets = byDay.get(dayKey!) ?? [];
      dayAssets.push(asset);
      byDay.set(dayKey!, dayAssets);
    }

    return [...byDay.values()];
  }

  private getTripTargetSize(dayCount: number, representativeCount: number) {
    if (representativeCount <= RecentTripMemoryRule.SMALL_TRIP_MAX) {
      return representativeCount;
    }

    if (dayCount >= 5 || representativeCount >= 18) {
      return 10;
    }

    if (dayCount >= 4 || representativeCount >= 12) {
      return 8;
    }

    return 7;
  }

  private pickDayCoverage(dayBuckets: MemoryAsset[][], targetSize: number): MemoryAsset[] {
    const buckets = dayBuckets.length <= targetSize ? dayBuckets : this.pickEvenlySpaced(dayBuckets, targetSize);
    return buckets.map((assets) => assets[Math.floor((assets.length - 1) / 2)]!);
  }

  private pickEvenlySpaced<T>(items: T[], count: number): T[] {
    if (count <= 0 || items.length === 0) {
      return [];
    }

    if (count >= items.length) {
      return [...items];
    }

    if (count === 1) {
      return [items[Math.floor((items.length - 1) / 2)]!];
    }

    const indexes = Array.from({ length: count }, (_, index) => Math.round((index * (items.length - 1)) / (count - 1)));

    return indexes.map((index) => items[index]!);
  }
}
