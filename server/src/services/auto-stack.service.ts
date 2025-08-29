import { Injectable } from '@nestjs/common';
import { OnEvent, OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { ImmichWorker, JobName, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { computeAutoStackScore } from 'src/services/auto-stack.scoring';
import { cosSim01, extractNumericSuffix, hammingHex64, norm } from 'src/services/auto-stack.utils';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

/**
 * AutoStackService listens to metadata extraction events and creates stacks automatically
 * Google-Photos style heuristic: invoked per asset after metadata extraction; builds visual/time groups.
 */
@Injectable()
export class AutoStackService extends BaseService {
  /**
   * Increment a Prometheus counter for AutoStack with a consistent access path.
   * Keeps metric names centralized and avoids repetitive plumbing.
   */
  private inc(name: string, value = 1) {
    this.telemetryRepository.jobs.addToCounter(name, value);
  }
  /*
   * NOTE: This file was becoming very long and hard to follow. The core
   * generateTimeWindowCandidates method contained many tightly coupled blocks:
   *   1. Window sampling + embedding preload
   *   2. Initial temporal / filename continuity grouping
   *   3. Session segmentation
   *   4. Merge + visual bridge phase
   *   5. Overlap/intersection merge
   *   6. Secondary visual expansion (outside-window augment)
   *   7. Outlier pruning
   *   8. Primary asset heuristic reordering
   *   9. Scoring + candidate creation + auto-promotion
   *
   * For readability the logic is now decomposed into small private helpers
   * with clear names and doc comments. Behavioral intent is unchanged.
   */

  /** Build initial continuity-based groups (temporal OR sequential filename). */
  private buildInitialGroups(sample: any[], maxGapSeconds: number, minGroupSize: number): string[][] {
    const groups: string[][] = [];
    let current: string[] = [];
    for (let i = 0; i < sample.length; i++) {
      const cur = sample[i];
      const prev = i > 0 ? sample[i - 1] : null;
      const curTime = cur.dateTimeOriginal ? new Date(cur.dateTimeOriginal).getTime() : Number.NaN;
      const prevTime = prev?.dateTimeOriginal ? new Date(prev.dateTimeOriginal).getTime() : Number.NaN;
      const timeOk = prev
        ? !Number.isNaN(curTime) && !Number.isNaN(prevTime) && curTime - prevTime <= maxGapSeconds * 1000
        : true;
      const curNum = extractNumericSuffix(cur.originalFileName);
      const prevNum = prev ? extractNumericSuffix(prev?.originalFileName) : null;
      const seqOk = prev ? curNum !== null && prevNum !== null && (curNum === prevNum + 1 || curNum === prevNum) : true;
      if (!prev || timeOk || seqOk) {
        current.push(cur.id);
      } else {
        if (current.length >= minGroupSize) {
          groups.push(current);
        }
        this.logger.verbose(
          `AutoStack: split group due to gap (timeOk=${timeOk} seqOk=${seqOk}) prev=${prev?.id} cur=${cur.id} sizeSoFar=${current.length}`,
        );
        current = [cur.id];
      }
    }
    if (current.length >= minGroupSize) {
      groups.push(current);
    }
    if (groups.length === 0 && sample.length >= minGroupSize) {
      this.logger.verbose(`AutoStack: fallback grouping all ${sample.length} assets (no continuity groups)`);
      groups.push(sample.map((s: any) => s.id));
    }
    this.logger.verbose(`AutoStack: formed ${groups.length} group(s) sizes=[${groups.map((g) => g.length).join(',')}]`);
    return groups;
  }

  /** Session segmentation pass (splits overly long span groups with low adjacency similarity). */
  private applySessionSegmentation(
    groups: string[][],
    workingSample: any[],
    embeddingMap: Record<string, number[]>,
    opts: {
      sessionMaxSpanSeconds?: number;
      sessionMinAvgAdjacency?: number;
      sessionMinSegmentSize?: number;
      minGroupSize: number;
    },
  ): string[][] {
    const { sessionMaxSpanSeconds, sessionMinAvgAdjacency, sessionMinSegmentSize, minGroupSize } = opts;
    if (!sessionMaxSpanSeconds || sessionMaxSpanSeconds <= 0) {
      return groups;
    }
    const byId: Record<string, any> = Object.fromEntries(workingSample.map((r: any) => [r.id, r]));
    const segMinSize = sessionMinSegmentSize || minGroupSize;
    const newGroups: string[][] = [];
    for (const g of groups) {
      if (g.length < segMinSize + 1) {
        newGroups.push(g);
        continue;
      }
      const times = g
        .map((id) => (byId[id]?.dateTimeOriginal ? new Date(byId[id].dateTimeOriginal).getTime() : Number.NaN))
        .filter((t) => !Number.isNaN(t))
        .sort();
      if (times.length === 0) {
        newGroups.push(g);
        continue;
      }
      const spanSecs = (times.at(-1) ?? 0 - times[0]) / 1000;
      if (spanSecs <= sessionMaxSpanSeconds) {
        newGroups.push(g);
        continue;
      }
      // compute adjacency similarity
      const embGroup = g.map((id) => ({ id, emb: embeddingMap[id] })).filter((x) => x.emb);
      const adjScores: number[] = [];
      for (let i = 1; i < embGroup.length; i++) {
        const a = embGroup[i - 1];
        const b = embGroup[i];
        if (!a.emb || !b.emb) {
          adjScores.push(0);
          continue;
        }
        const na = norm(a.emb);
        const nb = norm(b.emb);
        if (!na || !nb) {
          adjScores.push(0);
          continue;
        }
        let dot = 0;
        for (let k = 0; k < Math.min(a.emb.length, b.emb.length); k++) {
          dot += a.emb[k] * b.emb[k];
        }
        adjScores.push((dot / (na * nb) + 1) / 2);
      }
      const avgAdj = adjScores.length > 0 ? adjScores.reduce((a, b) => a + b, 0) / adjScores.length : 1;
      if (sessionMinAvgAdjacency && avgAdj >= sessionMinAvgAdjacency) {
        newGroups.push(g);
        continue;
      }
      // split at largest temporal gap
      const ordered = [...g].sort((a, b) => {
        const ta = byId[a]?.dateTimeOriginal ? new Date(byId[a].dateTimeOriginal).getTime() : 0;
        const tb = byId[b]?.dateTimeOriginal ? new Date(byId[b].dateTimeOriginal).getTime() : 0;
        return ta - tb;
      });
      let bestIdx = -1;
      let bestGap = 0;
      for (let i = 1; i < ordered.length; i++) {
        const tPrev = new Date(byId[ordered[i - 1]].dateTimeOriginal).getTime();
        const tCur = new Date(byId[ordered[i]].dateTimeOriginal).getTime();
        const gap = (tCur - tPrev) / 1000;
        if (gap > bestGap) {
          bestGap = gap;
          bestIdx = i;
        }
      }
      if (bestIdx > 0) {
        const left = ordered.slice(0, bestIdx);
        const right = ordered.slice(bestIdx);
        if (left.length >= segMinSize) {
          newGroups.push(left);
        }
        if (right.length >= segMinSize) {
          newGroups.push(right);
        }
        if (left.length < segMinSize || right.length < segMinSize) {
          newGroups.push(g);
        } // fallback keep original
        this.inc('immich.auto_stack.session_segments_split', 1);
      } else {
        newGroups.push(g);
      }
    }
    if (newGroups.length !== groups.length) {
      this.logger.verbose(`AutoStack: session segmentation adjusted groups ${groups.length} -> ${newGroups.length}`);
    }
    return newGroups;
  }

  /** Merge adjacent groups via temporal gap or visual bridge heuristic. */
  private mergeAdjacentGroups(
    groups: string[][],
    workingSample: any[],
    embeddingMap: Record<string, number[]>,
    options: {
      maxGapSeconds: number;
      maxMergeGapSeconds: number;
      visualBridgeThreshold?: number;
      mergeScoreDelta?: number;
      windowSeconds: number;
      weights: any;
    },
  ): string[][] {
    const { maxGapSeconds, maxMergeGapSeconds, visualBridgeThreshold, mergeScoreDelta, windowSeconds, weights } =
      options;
    if (!(groups.length > 1 && (maxMergeGapSeconds > maxGapSeconds || visualBridgeThreshold))) {
      return groups;
    }
    const byId: Record<string, any> = Object.fromEntries(workingSample.map((r: any) => [r.id, r]));
    const groupScore: Map<number, { total: number; components: Record<string, number> }> = new Map();
    const computeGroupScoreLocal = (ids: string[]) => {
      const assets = ids.map((id) => byId[id]);
      const { total, components } = computeAutoStackScore({
        assets,
        embeddingMap,
        weights,
        maxGapSeconds,
        windowSeconds,
      });
      return { total, components };
    };
    for (let gi = 0; gi < groups.length; gi++) {
      groupScore.set(gi, computeGroupScoreLocal(groups[gi]));
    }
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < groups.length - 1; i++) {
        const g1 = groups[i];
        const g2 = groups[i + 1];
        const last1 = byId[g1.at(-1) ?? 0];
        const first2 = byId[g2[0]];
        const t1 = last1?.dateTimeOriginal ? new Date(last1.dateTimeOriginal).getTime() : Number.NaN;
        const t2 = first2?.dateTimeOriginal ? new Date(first2.dateTimeOriginal).getTime() : Number.NaN;
        const gapSecs = !Number.isNaN(t1) && !Number.isNaN(t2) ? (t2 - t1) / 1000 : Number.POSITIVE_INFINITY;
        const timeEligible = gapSecs <= maxMergeGapSeconds && gapSecs > maxGapSeconds;
        let visualEligible = false;
        let bridgeSim: number | null = null;
        if (!timeEligible && visualBridgeThreshold && gapSecs <= windowSeconds) {
          const embA = embeddingMap[last1.id];
          const embB = embeddingMap[first2.id];
          if (embA && embB) {
            const nA = norm(embA);
            const nB = norm(embB);
            if (nA && nB) {
              let dot = 0;
              for (let k = 0; k < Math.min(embA.length, embB.length); k++) {
                dot += embA[k] * embB[k];
              }
              bridgeSim = (dot / (nA * nB) + 1) / 2;
              if (bridgeSim >= visualBridgeThreshold) {
                visualEligible = true;
              }
            }
          }
        }
        if (!(timeEligible || visualEligible)) {
          continue;
        }
        const mergedIds = [...g1, ...g2];
        const mergedScore = computeGroupScoreLocal(mergedIds);
        const s1 = groupScore.get(i)!;
        const s2 = groupScore.get(i + 1)!;
        const gain = mergedScore.total - Math.max(s1.total, s2.total);
        if (mergeScoreDelta !== undefined && mergeScoreDelta !== null && gain < mergeScoreDelta) {
          continue;
        }
        this.logger.verbose(
          `AutoStack: merging groups i=${i} sizes=(${g1.length}+${g2.length}) gap=${gapSecs.toFixed(2)}s timeEligible=${timeEligible} visualEligible=${visualEligible} bridgeSim=${bridgeSim?.toFixed(3)}`,
        );
        groups[i] = mergedIds;
        groups.splice(i + 1, 1);
        groupScore.set(i, mergedScore);
        for (let j = i + 1; j < groups.length; j++) {
          if (groupScore.has(j + 1)) {
            groupScore.set(j, groupScore.get(j + 1)!);
            groupScore.delete(j + 1);
          }
        }
        this.inc('immich.auto_stack.groups_merged', 1);
        this.inc('immich.auto_stack.groups_expanded', g2.length);
        merged = true;
        break; // restart loop after change
      }
    }
    this.logger.verbose(
      `AutoStack: post-merge groups=${groups.length} sizes=[${groups.map((g) => g.length).join(',')}]`,
    );
    return groups;
  }

  /** Determine a coarse orientation bucket for an asset (portrait, landscape, square, panorama, ultra-wide, unknown). */
  private getOrientationBucket(rec: any): string {
    const w = rec?.exifImageWidth || rec?.width || rec?.imageWidth || null;
    const h = rec?.exifImageHeight || rec?.height || rec?.imageHeight || null;
    if (!w || !h || w <= 0 || h <= 0) {
      return 'unknown';
    }
    const ratio = w / h;
    if (ratio >= 0.95 && ratio <= 1.05) {
      return 'square';
    }
    if (ratio > 1.05 && ratio < 2.2) {
      return 'landscape';
    }
    if (ratio >= 2.2 && ratio < 3.5) {
      return 'panorama';
    }
    if (ratio >= 3.5) {
      return 'ultrawide';
    }
    if (ratio < 0.95 && ratio > 0.5) {
      return 'portrait';
    }
    if (ratio <= 0.5) {
      return 'tall';
    }
    return 'unknown';
  }

  /** Enforce orientation homogeneity inside a group; splits group when multiple buckets present. */
  private enforceOrientationHomogeneity(groups: string[][], workingSample: any[], minGroupSize: number): string[][] {
    const byId: Record<string, any> = Object.fromEntries(workingSample.map((r: any) => [r.id, r]));
    const newGroups: string[][] = [];
    for (const g of groups) {
      const buckets: Record<string, string[]> = {};
      for (const id of g) {
        const bucket = this.getOrientationBucket(byId[id]);
        (buckets[bucket] ||= []).push(id);
      }
      const distinctAll = Object.keys(buckets).filter((b) => buckets[b].length);
      const distinct = distinctAll.filter((b) => b !== 'unknown');
      if (distinct.length <= 1) {
        newGroups.push(g);
        continue;
      }
      // If multiple, keep only buckets that meet minGroupSize (others discarded / left ungrouped)
      for (const b of distinct) {
        if (buckets[b].length >= minGroupSize) {
          newGroups.push(buckets[b]);
        } else {
          this.logger.debug(
            `AutoStack: orientation bucket ${b} size=${buckets[b].length} below minGroupSize – discarded from grouping`,
          );
        }
      }
      this.inc('immich.auto_stack.orientation_splits', 1);
    }
    return newGroups;
  }

  /** Overlap/intersection merge pass. */
  private mergeOverlapGroups(groups: string[][]): string[][] {
    if (!(groups.length > 1)) {
      return groups;
    }
    let changed = true;
    while (changed) {
      changed = false;
      outer: for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          const a = groups[i];
          const b = groups[j];
          const setA = new Set(a);
          const inter = b.filter((x) => setA.has(x));
          if (inter.length > 0) {
            groups[i] = [...new Set([...a, ...b])];
            groups.splice(j, 1);
            changed = true;
            this.logger.debug(`AutoStack: overlap merge groups (${i},${j}) newSize=${groups[i].length}`);
            break outer;
          }
        }
      }
    }
    return groups;
  }

  /** Secondary visual expansion (adds near duplicates just outside primary window). */
  private async expandGroupsVisually(params: {
    groups: string[][];
    ownerId: string;
    reference: Date;
    from: Date;
    to: Date;
    secondaryVisualWindowSeconds?: number;
    visualGroupSimilarityThreshold?: number;
    pHashHammingThreshold?: number;
    make: string | null;
    model: string | null;
    embeddingMap: Record<string, number[]>;
    workingSample: any[];
    secondaryVisualMaxAdds: number;
  }): Promise<void> {
    const {
      groups,
      ownerId,
      reference,
      from,
      to,
      secondaryVisualWindowSeconds,
      visualGroupSimilarityThreshold,
      pHashHammingThreshold,
      make,
      model,
      embeddingMap,
      workingSample,
      secondaryVisualMaxAdds,
    } = params;
    if (!secondaryVisualWindowSeconds || !(visualGroupSimilarityThreshold || pHashHammingThreshold !== undefined)) {
      return;
    }
    try {
      const expandFrom = new Date(reference.getTime() - secondaryVisualWindowSeconds * 1000);
      const expandTo = new Date(reference.getTime() + secondaryVisualWindowSeconds * 1000);
      const wideSample = await this.assetRepository.getTimeWindowCameraSequence({
        ownerId,
        from: expandFrom,
        to: expandTo,
        make,
        model,
      });
      const outside = wideSample.filter((r: any) => r.dateTimeOriginal < from || r.dateTimeOriginal > to);
      if (outside.length === 0 || groups.length === 0) {
        return;
      }
      const extraIds = outside.map((o: any) => o.id).filter((id: string) => !embeddingMap[id]);
      if (extraIds.length > 0) {
        try {
          Object.assign(embeddingMap, await this.assetRepository.getClipEmbeddings(extraIds));
        } catch {
          this.logger.warn(`AutoStack: failed to preload embeddings for ${extraIds.length} outside assets`);
          return;
        }
      }
      const hamming = (a?: string, b?: string) => hammingHex64(a ?? undefined, b ?? undefined);
      for (const g of groups) {
        let added = 0;
        const gSet = new Set(g);
        const groupEmbeddings = g.map((id) => embeddingMap[id]).filter(Boolean);
        let centroid: number[] | null = null;
        if (groupEmbeddings.length > 0) {
          const dim = groupEmbeddings[0].length;
          centroid = Array.from({ length: dim }).fill(0) as number[];
          for (const v of groupEmbeddings) {
            for (let d = 0; d < dim; d++) {
              centroid[d] += v[d];
            }
          }
          for (let d = 0; d < dim; d++) {
            centroid[d] /= groupEmbeddings.length;
          }
        }
        for (const cand of outside) {
          if (added >= (secondaryVisualMaxAdds ?? 5)) {
            break;
          }
          if (gSet.has(cand.id)) {
            continue;
          }
          let phOk = false;
          if (pHashHammingThreshold !== undefined && pHashHammingThreshold !== null && cand.pHash) {
            for (const mid of g) {
              const mRec: any = workingSample.find((w: any) => w.id === mid);
              if (mRec?.pHash && hamming(cand.pHash, mRec.pHash) <= pHashHammingThreshold) {
                phOk = true;
                break;
              }
            }
          }
          let visOk = false;
          if (!visOk && visualGroupSimilarityThreshold && centroid) {
            const emb = embeddingMap[cand.id];
            if (emb) {
              visOk = cosSim01(centroid, emb) >= visualGroupSimilarityThreshold;
            }
          }
          if (visOk || phOk) {
            g.push(cand.id);
            gSet.add(cand.id);
            added++;
            this.logger.debug(
              `AutoStack: visual expansion added asset=${cand.id} to group size=${g.length} (visOk=${visOk} phOk=${phOk})`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.debug(`AutoStack: secondary visual expansion error: ${error}`);
    }
  }

  /** Outlier pruning loop (optionally iterative). Returns possibly pruned group. */
  private async pruneOutliers(
    group: string[],
    gi: number,
    options: {
      enabled: boolean;
      iterative: boolean;
      minDelta: number;
      score: (assetIds: string[], groupIndex: number) => any;
      weights: any;
    },
  ): Promise<{ group: string[]; pruned: number }> {
    const { enabled, iterative, minDelta, score, weights } = options;
    if (!enabled || group.length <= 2) {
      return { group, pruned: 0 };
    }
    let g = [...group];
    let pruned = 0;
    let improved = true;
    let passes = 0;
    while (improved && passes < 3) {
      improved = false;
      passes++;
      const base = await score(g, gi);
      const baseVisual = base.components?.visual ?? 0;
      let bestGain = 0;
      let bestGroup: string[] | null = null;
      for (const removeId of g) {
        const trial = g.filter((id) => id !== removeId);
        if (trial.length < 2) {
          continue;
        }
        const trialScore = await score(trial, gi);
        const trialVisual = trialScore.components?.visual ?? 0;
        const gain = trialVisual - baseVisual;
        if (gain > minDelta * (weights?.visual || 15) && gain > bestGain) {
          bestGain = gain;
          bestGroup = trial;
        }
      }
      if (bestGroup) {
        this.logger.debug(
          `AutoStack: outlier pruning removed asset (pass=${passes}) size=${g.length} -> ${bestGroup.length} visualGain=${bestGain.toFixed(2)}`,
        );
        g = bestGroup;
        pruned++;
        improved = iterative && g.length > 2;
      }
      if (!iterative) {
        break;
      }
    }
    return { group: g, pruned };
  }

  /** Reorder group primary by image quality heuristic. */
  private reorderPrimary(group: string[], workingSample: any[], enabled: boolean): string[] {
    if (!enabled || group.length < 2) {
      return group;
    }
    try {
      const details = workingSample.filter((s: any) => group.includes(s.id));
      details.sort((a: any, b: any) => {
        const isoA = a.iso ?? Number.MAX_SAFE_INTEGER;
        const isoB = b.iso ?? Number.MAX_SAFE_INTEGER;
        if (isoA !== isoB) {
          return isoA - isoB;
        }
        const expA = a.exposureTime ?? Number.MAX_VALUE;
        const expB = b.exposureTime ?? Number.MAX_VALUE;
        if (expA !== expB) {
          return expA - expB;
        }
        const tA = a.dateTimeOriginal ? new Date(a.dateTimeOriginal).getTime() : Number.MAX_SAFE_INTEGER;
        const tB = b.dateTimeOriginal ? new Date(b.dateTimeOriginal).getTime() : Number.MAX_SAFE_INTEGER;
        if (tA !== tB) {
          return tA - tB;
        }
        return a.id.localeCompare(b.id);
      });
      const reordered = details.map((d: any) => d.id);
      if (reordered[0] !== group[0]) {
        this.logger.debug(`AutoStack: primary heuristic reordered group primary ${group[0]} -> ${reordered[0]}`);
        this.inc('immich.auto_stack.primary_reordered_quality', 1);
        return reordered;
      }
    } catch {
      this.logger.warn(`AutoStack: primary heuristic reordering failed for group ${group.join(',')}`);
    }
    return group;
  }

  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Microservices] })
  onAppBootstrap() {
    this.logger.log('AutoStack: service initialized (listening for AssetMetadataExtracted)');
  }

  // Listen for SmartSearch completion to trigger auto-stack candidate generation
  @OnEvent({ name: 'AssetSmartSearchProcessed' })
  async onAssetSmartSearchProcessed({ assetId, userId }: ArgOf<'AssetSmartSearchProcessed'>) {
    try {
      const { server } = await this.getConfig({ withCache: true });
      if (!server.autoStack.enabled) {
        return;
      }
      await this.jobRepository.queue({ name: JobName.AutoStackCandidateGenerateForAsset, data: { id: assetId } });
      this.logger.debug(`AutoStack: queued asset candidate generation job asset=${assetId} user=${userId}`);
      this.inc('immich.auto_stack.jobs_queued', 1);
    } catch (error) {
      this.logger.warn(`AutoStackService queue-on-smart-search failed for asset ${assetId}: ${error}`);
    }
  }

  /** Core candidate generation pipeline (refactored for readability). */
  async generateTimeWindowCandidates(
    ownerId: string,
    reference: Date,
    overrideWindowSeconds: number | undefined,
    referenceAssetId?: string,
  ): Promise<number> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) {
      return 0;
    }
    const {
      windowSeconds,
      maxGapSeconds,
      minGroupSize,
      cameraMatch,
      autoPromoteMinScore,
      weights,
      visualPromoteThreshold,
      outlierPruneEnabled,
      outlierPruneMinDelta,
      outlierPruneIterative,
      secondaryVisualWindowSeconds,
      visualGroupSimilarityThreshold,
      pHashHammingThreshold,
      overlapMergeEnabled,
      bestPrimaryHeuristic,
      secondaryVisualMaxAdds = 5,
      sessionMaxSpanSeconds,
      sessionMinAvgAdjacency,
      sessionMinSegmentSize,
    } = server.autoStack;

    // Time window sample
    const effectiveWindow = overrideWindowSeconds || windowSeconds;
    const from = new Date(reference.getTime() - effectiveWindow * 1000);
    const to = new Date(reference.getTime() + effectiveWindow * 1000);
    let make: string | null = null;
    let model: string | null = null;
    if (cameraMatch && referenceAssetId) {
      const exif = await this.assetRepository.getExifMakeModel(referenceAssetId);
      if (exif) {
        make = exif.make;
        model = exif.model;
      }
    }
    const sample = await this.assetRepository.getTimeWindowCameraSequence({ ownerId, from, to, make, model });
    this.logger.debug(
      `AutoStack: window scan owner=${ownerId} ref=${reference.toISOString()} window=${effectiveWindow}s make=${make || '∅'} model=${model || '∅'} found=${sample.length}`,
    );
    if (sample.length < 2) {
      this.logger.debug(
        `AutoStack: insufficient assets (found=${sample.length}) in window (+/-${effectiveWindow}s) for owner=${ownerId}`,
      );
      return 0;
    }
    const workingSample = sample;
    let embeddingMap: Record<string, number[]> = {};
    try {
      embeddingMap = await this.assetRepository.getClipEmbeddings(workingSample.map((s: any) => s.id));
    } catch (error) {
      this.logger.debug(`AutoStack: embedding preload failed: ${error}`);
    }

    // 1. Initial groups
    let groups = this.buildInitialGroups(workingSample, maxGapSeconds, minGroupSize);
    if (groups.length === 0) {
      this.logger.debug(
        `AutoStack: no groups >= minGroupSize=${minGroupSize} (candidates examined=${workingSample.length}) owner=${ownerId}`,
      );
      return 0;
    }
    // 2. Session segmentation
    groups = this.applySessionSegmentation(groups, workingSample, embeddingMap, {
      sessionMaxSpanSeconds,
      sessionMinAvgAdjacency,
      sessionMinSegmentSize,
      minGroupSize,
    });
    // 3. Merge & visual bridge
    const { maxMergeGapSeconds = maxGapSeconds, visualBridgeThreshold, mergeScoreDelta } = server.autoStack as any;
    groups = this.mergeAdjacentGroups(groups, workingSample, embeddingMap, {
      maxGapSeconds,
      maxMergeGapSeconds,
      visualBridgeThreshold,
      mergeScoreDelta,
      windowSeconds,
      weights,
    });
    // 4. Overlap merge if enabled
    if (overlapMergeEnabled) {
      groups = this.mergeOverlapGroups(groups);
    }
    // 5. Secondary visual expansion
    await this.expandGroupsVisually({
      groups,
      ownerId,
      reference,
      from,
      to,
      secondaryVisualWindowSeconds,
      visualGroupSimilarityThreshold,
      pHashHammingThreshold,
      make,
      model,
      embeddingMap,
      workingSample,
      secondaryVisualMaxAdds,
    });

    // 6. Enforce orientation homogeneity (prevent mixing portrait/landscape/panorama etc.)
    const beforeOrientation = groups.length;
    groups = this.enforceOrientationHomogeneity(groups, workingSample, minGroupSize);
    if (groups.length !== beforeOrientation) {
      this.logger.debug(`AutoStack: orientation enforcement adjusted groups ${beforeOrientation} -> ${groups.length}`);
    }

    const created = 0;
    const scoreGroup = (assetIds: string[], _: number) => {
      const subset = workingSample.filter((s: any) => assetIds.includes(s.id));
      const local = computeAutoStackScore({ assets: subset, embeddingMap, weights, maxGapSeconds, windowSeconds });
      return local;
    };

    const prunedTotal = 0;
    for (let gi = 0; gi < groups.length; gi++) {
      let g = groups[gi];
      try {
        const { group: prunedGroup, pruned } = await this.pruneOutliers(g, gi, {
          enabled: !!outlierPruneEnabled,
          iterative: !!outlierPruneIterative,
          minDelta: outlierPruneMinDelta ?? 0.05,
          score: scoreGroup,
          weights,
        });
        if (pruned) {
          this.inc('immich.auto_stack.candidates_pruned_outliers', pruned);
        }
        g = prunedGroup;
      } catch (error) {
        this.logger.debug(`AutoStack: outlier pruning error: ${error}`);
      }
      g = this.reorderPrimary(g, workingSample, !!bestPrimaryHeuristic);
      const { total: score, components } = scoreGroup(g, gi);
      this.logger.debug(
        `AutoStack: creating candidate size=${g.length} score=${score} components=${JSON.stringify(components)} owner=${ownerId}`,
      );
      const promoteByVisual =
        visualPromoteThreshold && components.visual / (weights?.visual ?? 15) >= visualPromoteThreshold;
      if ((autoPromoteMinScore > 0 && score >= autoPromoteMinScore) || promoteByVisual) {
        let stack;
        try {
          stack = await this.stackRepository.create({ ownerId }, g);
          await Promise.all(
            g.map((id: string) => this.assetRepository.upsertExif({ assetId: id, autoStackSource: 'VISUAL' as any })),
          );
          this.logger.debug(
            `AutoStack: auto-promoted candidate to stack id=${stack.id} owner=${ownerId} size=${g.length} score=${score}${JSON.stringify(components)} visual=${components.visual}`,
          );
        } catch (error: any) {
          const msg = error?.message || String(error);
          if (msg.includes('duplicate key') && msg.includes('stack_primaryAssetId_uq')) {
            this.logger.debug(
              `AutoStack: auto-promote race detected; stack already exists for primary=${g[0]} owner=${ownerId}`,
            );
            continue;
          }
          throw error;
        }
        await this.eventRepository.emit('StackCreate', { stackId: stack.id, userId: ownerId });
        this.inc('immich.auto_stack.candidates_auto_promoted', 1);
        continue;
      }
    }
    if (prunedTotal) {
      this.inc('immich.auto_stack.candidates_pruned', prunedTotal);
    }
    if (created) {
      this.logger.log(`AutoStack: generated ${created} candidate group(s) for owner=${ownerId}`);
      this.inc('immich.auto_stack.candidates_created', created);
    } else {
      this.logger.verbose(`AutoStack: all groups already had candidates for owner=${ownerId}`);
    }
    return created;
  }

  @OnJob({ name: JobName.AutoStackCandidateQueueAll, queue: QueueName.AutoStack })
  async handleQueueAllCandidates(job: JobOf<JobName.AutoStackCandidateQueueAll>): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) {
      return JobStatus.Skipped;
    }
    const users = await this.userRepository.getList({ withDeleted: false });
    this.logger.log(`AutoStack: queuing candidate generation for ${users.length} users`);
    await this.jobRepository.queueAll(
      users.map((u: any) => ({ name: JobName.AutoStackCandidateGenerate, data: { id: u.id, force: job.force } })),
    );
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AutoStackCandidateGenerate, queue: QueueName.AutoStack })
  async handleGenerateCandidates(job: JobOf<JobName.AutoStackCandidateGenerate>): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) {
      return JobStatus.Skipped;
    }
    this.logger.verbose(`AutoStack: generating candidates for owner=${job.id} force=${job.force}`);
    // If force is set, delete all existing candidates for this user
    if (job.force) {
      this.logger.verbose(`AutoStack: force mode enabled, deleting existing candidates for owner=${job.id}`);
      const existingStacks = await this.stackRepository.getByOwnerId(job.id);
      await this.stackRepository.deleteAll(existingStacks.map((s: any) => s.id));
    }
    const allAssets = await this.assetRepository.getByOwnerId(job.id);
    this.logger.debug(`AutoStack: found ${allAssets.length} assets for owner=${job.id}`);
    if (allAssets.length === 0) {
      this.logger.debug(`AutoStack: no assets found for owner=${job.id}, skipping candidate generation`);
      return JobStatus.Skipped;
    }
    for (const asset of allAssets) {
      await this.jobRepository.queue({ name: JobName.AutoStackCandidateGenerateForAsset, data: { id: asset.id } });
    }
    this.logger.debug(`AutoStack: queued candidate generation for ${allAssets.length} assets for owner=${job.id}`);

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AutoStackCandidateGenerateForAsset, queue: QueueName.AutoStack })
  async handleGenerateCandidatesForAsset(job: JobOf<JobName.AutoStackCandidateGenerateForAsset>): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) {
      return JobStatus.Skipped;
    }
    try {
      const asset = await this.assetRepository.getById(job.id);
      if (!asset) {
        return JobStatus.Skipped;
      }
      const dto = await this.assetRepository.getDateTimeOriginal(job.id);
      if (!dto) {
        return JobStatus.Skipped;
      }
      await this.generateTimeWindowCandidates(asset.ownerId, dto, undefined, job.id);
      return JobStatus.Success;
    } catch (error) {
      this.logger.warn(`AutoStack: asset-specific candidate generation failed asset=${job.id}: ${error}`);
      return JobStatus.Failed;
    }
  }

  @OnJob({ name: JobName.AutoStackCandidateResetAll, queue: QueueName.AutoStack })
  async handleResetAll(): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) {
      return JobStatus.Skipped;
    }
    try {
      await this.stackRepository.clearAll();
      this.logger.log('AutoStack: cleared all existing candidates and stacks');
      const users = await this.userRepository.getList({ withDeleted: false });
      await this.jobRepository.queueAll(
        users.map((u: any) => ({ name: JobName.AutoStackCandidateGenerate, data: { id: u.id } })),
      );
      return JobStatus.Success;
    } catch (error) {
      this.logger.warn(`AutoStack: reset failed: ${error}`);
      return JobStatus.Failed;
    }
  }

  /** Controller-facing: queue global reset of candidates and stacks. */
  async resetAll(_: AuthDto) {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) {
      return { error: 'disabled' } as const;
    }
    // Queue a global reset: use existing queue-all job placeholder (same as controller intent)
    await this.jobRepository.queue({ name: JobName.AutoStackCandidateQueueAll, data: {} as any });
    return { status: 'queued' } as const;
  }
}
