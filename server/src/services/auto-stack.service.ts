import { Injectable } from '@nestjs/common';
import { OnEvent, OnJob } from 'src/decorators';
import { ImmichWorker, JobName, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { computeAutoStackScore } from './auto-stack.scoring';

/**
 * AutoStackService listens to metadata extraction events and creates stacks automatically
 * Google-Photos style heuristic: invoked per asset after metadata extraction; builds visual/time groups.
 */
@Injectable()
export class AutoStackService extends BaseService {
  /*
   * NOTE: This file was becoming very long and hard to follow. The core
   * generateTimeWindowCandidates method contained many tightly coupled blocks:
   *   1. Hysteresis / dynamic threshold adjustment
   *   2. Window sampling + embedding preload
   *   3. Initial temporal / filename continuity grouping
   *   4. Session segmentation
   *   5. Merge + visual bridge phase
   *   6. Overlap/intersection merge
   *   7. Secondary visual expansion (outside-window augment)
   *   8. Outlier pruning
   *   9. Primary asset heuristic reordering
   *  10. Scoring + candidate creation + auto-promotion
   *
   * For readability the logic is now decomposed into small private helpers
   * with clear names and doc comments. Behavioral intent is unchanged.
   */

  /** Hysteresis dynamic threshold raising; returns possibly raised autoPromoteMinScore. */
  private async applyHysteresis(ownerId: string, baseScore: number, hysteresis: {enabled: boolean, candidateWindowMinutes?: number, maxCandidates?: number, raiseScoreBy?: number}): Promise<number> {
    if (!hysteresis?.enabled) return baseScore;
    let dynamic = baseScore;
    try {
      const winMinutes = hysteresis.candidateWindowMinutes ?? 30;
      const maxPerWindow = hysteresis.maxCandidates ?? 100;
      const raiseBase = hysteresis.raiseScoreBy ?? 10;
      const now = new Date();
      const since = new Date(now.getTime() - winMinutes * 60_000);
      const recent = await this.autoStackCandidateRepository.countCreatedSince(ownerId, since);
      if (recent > maxPerWindow) {
        const factor = Math.min(3, recent / maxPerWindow); // cap 3x raise
        const raise = Math.round(raiseBase * factor);
        dynamic += raise;
        this.telemetryRepository.jobs.addToCounter('immich.auto_stack.hysteresis_threshold_raised', 1);
        this.telemetryRepository.jobs.addToCounter('immich.auto_stack.hysteresis_recent_overload', recent - maxPerWindow);
      }
    } catch (e) {
      this.logger.debug(`AutoStack: hysteresis computation failed: ${e}`);
    }
    return dynamic;
  }

  /** Build initial continuity-based groups (temporal OR sequential filename). */
  private buildInitialGroups(sample: any[], maxGapSeconds: number, minGroupSize: number, windowSeconds: number): string[][] {
    const groups: string[][] = [];
    let current: string[] = [];
    const suffix = (name: string) => name.match(/(\d+)(?=\.[^.]+$)/)?.[1] ?? '';
    const toNum = (s: string) => (s === '' ? NaN : Number.parseInt(s));
    for (let i = 0; i < sample.length; i++) {
      const cur = sample[i];
      const prev = i > 0 ? sample[i - 1] : null;
      const curTime = cur.dateTimeOriginal ? new Date(cur.dateTimeOriginal).getTime() : NaN;
      const prevTime = prev?.dateTimeOriginal ? new Date(prev.dateTimeOriginal).getTime() : NaN;
      const timeOk = prev ? !Number.isNaN(curTime) && !Number.isNaN(prevTime) && curTime - prevTime <= maxGapSeconds * 1000 : true;
      const curNum = toNum(suffix(cur.originalFileName));
      const prevNum = prev ? toNum(suffix(prev?.originalFileName)) : NaN;
      const seqOk = prev ? !Number.isNaN(curNum) && !Number.isNaN(prevNum) && (curNum === prevNum + 1 || curNum === prevNum) : true;
      if (!prev || timeOk || seqOk) {
        current.push(cur.id);
      } else {
        if (current.length >= minGroupSize) groups.push(current);
        this.logger.debug(
          `AutoStack: split group due to gap (timeOk=${timeOk} seqOk=${seqOk}) prev=${prev?.id} cur=${cur.id} sizeSoFar=${current.length}`,
        );
        current = [cur.id];
      }
    }
    if (current.length >= minGroupSize) groups.push(current);
    if (!groups.length) {
      if (sample.length >= minGroupSize) {
        this.logger.debug(`AutoStack: fallback grouping all ${sample.length} assets (no continuity groups)`);
        groups.push(sample.map((s: any) => s.id));
      }
    }
    this.logger.debug(`AutoStack: formed ${groups.length} group(s) sizes=[${groups.map((g) => g.length).join(',')}]`);
    return groups;
  }

  /** Session segmentation pass (splits overly long span groups with low adjacency similarity). */
  private applySessionSegmentation(groups: string[][], workingSample: any[], embeddingMap: Record<string, number[]>, opts: { sessionMaxSpanSeconds?: number; sessionMinAvgAdjacency?: number; sessionMinSegmentSize?: number; minGroupSize: number }): string[][] {
    const { sessionMaxSpanSeconds, sessionMinAvgAdjacency, sessionMinSegmentSize, minGroupSize } = opts;
    if (!sessionMaxSpanSeconds || sessionMaxSpanSeconds <= 0) return groups;
    const byId: Record<string, any> = Object.fromEntries(workingSample.map((r: any) => [r.id, r]));
    const segMinSize = sessionMinSegmentSize || minGroupSize;
    const newGroups: string[][] = [];
    for (const g of groups) {
      if (g.length < segMinSize + 1) { newGroups.push(g); continue; }
      const times = g.map(id => (byId[id]?.dateTimeOriginal ? new Date(byId[id].dateTimeOriginal).getTime() : NaN)).filter(t => !Number.isNaN(t)).sort();
      if (!times.length) { newGroups.push(g); continue; }
      const spanSecs = (times[times.length - 1] - times[0]) / 1000;
      if (spanSecs <= sessionMaxSpanSeconds) { newGroups.push(g); continue; }
      // compute adjacency similarity
      const embGroup = g.map(id => ({ id, emb: embeddingMap[id] })).filter(x => x.emb);
      const adjScores: number[] = [];
      const norm = (v: number[]) => Math.sqrt(v.reduce((a,b)=>a+b*b,0));
      for (let i=1;i<embGroup.length;i++) {
        const a = embGroup[i-1]; const b = embGroup[i];
        if (!a.emb || !b.emb) { adjScores.push(0); continue; }
        const na = norm(a.emb); const nb = norm(b.emb); if (!na||!nb) { adjScores.push(0); continue; }
        let dot=0; for (let k=0;k<Math.min(a.emb.length,b.emb.length);k++) dot += a.emb[k]*b.emb[k];
        adjScores.push((dot/(na*nb)+1)/2);
      }
      const avgAdj = adjScores.length ? adjScores.reduce((a,b)=>a+b,0)/adjScores.length : 1;
      if (sessionMinAvgAdjacency && avgAdj >= sessionMinAvgAdjacency) { newGroups.push(g); continue; }
      // split at largest temporal gap
      const ordered = g.slice().sort((a,b)=>{
        const ta = byId[a]?.dateTimeOriginal ? new Date(byId[a].dateTimeOriginal).getTime() : 0;
        const tb = byId[b]?.dateTimeOriginal ? new Date(byId[b].dateTimeOriginal).getTime() : 0;
        return ta - tb;
      });
      let bestIdx=-1; let bestGap=0;
      for (let i=1;i<ordered.length;i++) {
        const tPrev = new Date(byId[ordered[i-1]].dateTimeOriginal).getTime();
        const tCur = new Date(byId[ordered[i]].dateTimeOriginal).getTime();
        const gap = (tCur - tPrev)/1000; if (gap>bestGap) { bestGap=gap; bestIdx=i; }
      }
      if (bestIdx>0) {
        const left = ordered.slice(0,bestIdx); const right = ordered.slice(bestIdx);
        if (left.length >= segMinSize) newGroups.push(left);
        if (right.length >= segMinSize) newGroups.push(right);
        if (left.length < segMinSize || right.length < segMinSize) newGroups.push(g); // fallback keep original
        this.telemetryRepository.jobs.addToCounter('immich.auto_stack.session_segments_split', 1);
      } else newGroups.push(g);
    }
    if (newGroups.length !== groups.length) this.logger.debug(`AutoStack: session segmentation adjusted groups ${groups.length} -> ${newGroups.length}`);
    return newGroups;
  }

  /** Merge adjacent groups via temporal gap or visual bridge heuristic. */
  private async mergeAdjacentGroups(groups: string[][], workingSample: any[], embeddingMap: Record<string, number[]>, options: { maxGapSeconds: number; maxMergeGapSeconds: number; visualBridgeThreshold?: number; mergeScoreDelta?: number; windowSeconds: number; weights: any }): Promise<string[][]> {
    const { maxGapSeconds, maxMergeGapSeconds, visualBridgeThreshold, mergeScoreDelta, windowSeconds, weights } = options;
    if (!(groups.length > 1 && (maxMergeGapSeconds > maxGapSeconds || visualBridgeThreshold))) return groups;
    const byId: Record<string, any> = Object.fromEntries(workingSample.map((r: any) => [r.id, r]));
    const groupScore: Map<number, { total: number; components: Record<string, number> }> = new Map();
    const computeGroupScoreLocal = async (ids: string[]) => {
      const assets = ids.map(id => byId[id]);
      const { total, components } = computeAutoStackScore({ assets, embeddingMap, weights, maxGapSeconds, windowSeconds });
      return { total, components };
    };
    for (let gi=0; gi<groups.length; gi++) groupScore.set(gi, await computeGroupScoreLocal(groups[gi]));
    let merged = true;
    while (merged) {
      merged = false;
      for (let i=0; i<groups.length-1; i++) {
        const g1 = groups[i]; const g2 = groups[i+1];
        const last1 = byId[g1[g1.length - 1]]; const first2 = byId[g2[0]];
        const t1 = last1?.dateTimeOriginal ? new Date(last1.dateTimeOriginal).getTime() : NaN;
        const t2 = first2?.dateTimeOriginal ? new Date(first2.dateTimeOriginal).getTime() : NaN;
        const gapSecs = !Number.isNaN(t1) && !Number.isNaN(t2) ? (t2 - t1)/1000 : Number.POSITIVE_INFINITY;
        const timeEligible = gapSecs <= maxMergeGapSeconds && gapSecs > maxGapSeconds;
        let visualEligible = false; let bridgeSim: number | null = null;
        if (!timeEligible && visualBridgeThreshold && gapSecs <= windowSeconds) {
          const embA = embeddingMap[last1.id]; const embB = embeddingMap[first2.id];
          if (embA && embB) {
            const norm = (v: number[]) => Math.sqrt(v.reduce((a,b)=>a+b*b,0));
            const nA = norm(embA); const nB = norm(embB);
            if (nA && nB) {
              let dot=0; for (let k=0;k<Math.min(embA.length, embB.length); k++) dot += embA[k]*embB[k];
              bridgeSim = (dot/(nA*nB) + 1)/2;
              if (bridgeSim >= visualBridgeThreshold) visualEligible = true;
            }
          }
        }
        if (!(timeEligible || visualEligible)) continue;
        const mergedIds = [...g1, ...g2];
        const mergedScore = await computeGroupScoreLocal(mergedIds);
        const s1 = groupScore.get(i)!; const s2 = groupScore.get(i+1)!;
        const gain = mergedScore.total - Math.max(s1.total, s2.total);
        if (mergeScoreDelta !== undefined && mergeScoreDelta !== null && gain < mergeScoreDelta) continue;
        this.logger.debug(`AutoStack: merging groups i=${i} sizes=(${g1.length}+${g2.length}) gap=${gapSecs.toFixed(2)}s timeEligible=${timeEligible} visualEligible=${visualEligible} bridgeSim=${bridgeSim?.toFixed(3)}`);
        groups[i] = mergedIds; groups.splice(i+1,1); groupScore.set(i, mergedScore);
        for (let j=i+1; j<groups.length; j++) { if (groupScore.has(j+1)) { groupScore.set(j, groupScore.get(j+1)!); groupScore.delete(j+1); } }
        this.telemetryRepository.jobs.addToCounter('immich.auto_stack.groups_merged', 1);
        this.telemetryRepository.jobs.addToCounter('immich.auto_stack.groups_expanded', g2.length);
        merged = true; break; // restart loop after change
      }
    }
    this.logger.log(`AutoStack: post-merge groups=${groups.length} sizes=[${groups.map(g=>g.length).join(',')}]`);
    return groups;
  }

  /** Determine a coarse orientation bucket for an asset (portrait, landscape, square, panorama, ultra-wide, unknown). */
  private getOrientationBucket(rec: any): string {
    const w = rec?.exifImageWidth || rec?.width || rec?.imageWidth || null;
    const h = rec?.exifImageHeight || rec?.height || rec?.imageHeight || null;
    if (!w || !h || w <= 0 || h <= 0) return 'unknown';
    const ratio = w / h;
    if (ratio >= 0.95 && ratio <= 1.05) return 'square';
    if (ratio > 1.05 && ratio < 2.2) return 'landscape';
    if (ratio >= 2.2 && ratio < 3.5) return 'panorama';
    if (ratio >= 3.5) return 'ultrawide';
    if (ratio < 0.95 && ratio > 0.5) return 'portrait';
    if (ratio <= 0.5) return 'tall';
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
  const distinctAll = Object.keys(buckets).filter(b => buckets[b].length);
  const distinct = distinctAll.filter(b => b !== 'unknown');
  if (distinct.length <= 1) { newGroups.push(g); continue; }
      // If multiple, keep only buckets that meet minGroupSize (others discarded / left ungrouped)
      for (const b of distinct) {
        if (buckets[b].length >= minGroupSize) {
          newGroups.push(buckets[b]);
        } else {
          this.logger.debug(`AutoStack: orientation bucket ${b} size=${buckets[b].length} below minGroupSize – discarded from grouping`);
        }
      }
      this.telemetryRepository.jobs.addToCounter('immich.auto_stack.orientation_splits', 1);
    }
    return newGroups;
  }

  /** Overlap/intersection merge pass. */
  private mergeOverlapGroups(groups: string[][]): string[][] {
    if (!(groups.length > 1)) return groups;
    let changed = true;
    while (changed) {
      changed = false;
      outer: for (let i=0;i<groups.length;i++) {
        for (let j=i+1;j<groups.length;j++) {
          const a = groups[i]; const b = groups[j];
          const setA = new Set(a); const inter = b.filter(x=>setA.has(x));
          if (inter.length) { groups[i] = Array.from(new Set([...a,...b])); groups.splice(j,1); changed = true; this.logger.debug(`AutoStack: overlap merge groups (${i},${j}) newSize=${groups[i].length}`); break outer; }
        }
      }
    }
    return groups;
  }

  /** Secondary visual expansion (adds near duplicates just outside primary window). */
  private async expandGroupsVisually(params: { groups: string[][]; ownerId: string; reference: Date; from: Date; to: Date; secondaryVisualWindowSeconds?: number; visualGroupSimilarityThreshold?: number; pHashHammingThreshold?: number; make: string | null; model: string | null; embeddingMap: Record<string, number[]>; workingSample: any[]; secondaryVisualMaxAdds: number; }): Promise<void> {
    const { groups, ownerId, reference, from, to, secondaryVisualWindowSeconds, visualGroupSimilarityThreshold, pHashHammingThreshold, make, model, embeddingMap, workingSample, secondaryVisualMaxAdds } = params;
    if (!secondaryVisualWindowSeconds || !(visualGroupSimilarityThreshold || pHashHammingThreshold !== undefined)) return;
    try {
      const expandFrom = new Date(reference.getTime() - secondaryVisualWindowSeconds * 1000);
      const expandTo = new Date(reference.getTime() + secondaryVisualWindowSeconds * 1000);
      const wideSample = await this.assetRepository.getTimeWindowCameraSequence({ ownerId, from: expandFrom, to: expandTo, make, model });
      const outside = wideSample.filter((r: any) => r.dateTimeOriginal < from || r.dateTimeOriginal > to);
      if (!outside.length || !groups.length) return;
      const extraIds = outside.map((o: any) => o.id).filter((id: string) => !embeddingMap[id]);
      if (extraIds.length) { try { Object.assign(embeddingMap, await this.assetRepository.getClipEmbeddings(extraIds)); } catch {} }
      const hexToBigInt = (h: string) => { try { return BigInt('0x' + h); } catch { return null; } };
      const popcnt = (x: bigint) => { let c=0n; while (x) { x &= x-1n; c++; } return Number(c); };
      const hamming = (a?: string, b?: string) => { if (!a||!b||a.length!==b.length) return Number.POSITIVE_INFINITY; const A=hexToBigInt(a); const B=hexToBigInt(b); if (A===null||B===null) return Number.POSITIVE_INFINITY; return popcnt(A ^ B); };
      for (const g of groups) {
        let added = 0; const gSet = new Set(g);
        const groupEmbeddings = g.map(id=>embeddingMap[id]).filter(Boolean);
        let centroid: number[] | null = null;
        if (groupEmbeddings.length) {
          const dim = groupEmbeddings[0].length; centroid = new Array(dim).fill(0);
          for (const v of groupEmbeddings) for (let d=0; d<dim; d++) centroid[d]+=v[d];
          for (let d=0; d<dim; d++) centroid[d]/=groupEmbeddings.length;
        }
        const norm = (v: number[]) => Math.sqrt(v.reduce((a,b)=>a+b*b,0));
        const cosSim01 = (a: number[], b: number[]) => { const na=norm(a); const nb=norm(b); if (!na||!nb) return 0; let dot=0; for (let k=0;k<Math.min(a.length,b.length);k++) dot += a[k]*b[k]; return (dot/(na*nb)+1)/2; };
        for (const cand of outside) {
          if (added >= (secondaryVisualMaxAdds ?? 5)) break; if (gSet.has(cand.id)) continue;
          let phOk = false;
          if (pHashHammingThreshold !== undefined && pHashHammingThreshold !== null && cand.pHash) {
            for (const mid of g) { const mRec: any = workingSample.find((w: any) => w.id === mid); if (mRec?.pHash && hamming(cand.pHash, mRec.pHash) <= pHashHammingThreshold) { phOk = true; break; } }
          }
            let visOk = false;
          if (!visOk && visualGroupSimilarityThreshold && centroid) { const emb = embeddingMap[cand.id]; if (emb) visOk = cosSim01(centroid, emb) >= visualGroupSimilarityThreshold; }
          if (visOk || phOk) { g.push(cand.id); gSet.add(cand.id); added++; this.logger.debug(`AutoStack: visual expansion added asset=${cand.id} to group size=${g.length} (visOk=${visOk} phOk=${phOk})`); }
        }
      }
    } catch (e) { this.logger.debug(`AutoStack: secondary visual expansion error: ${e}`); }
  }

  /** Outlier pruning loop (optionally iterative). Returns possibly pruned group. */
  private async pruneOutliers(group: string[], gi: number, options: { enabled: boolean; iterative: boolean; minDelta: number; score: (assetIds: string[], groupIndex: number) => Promise<any>; weights: any }): Promise<{ group: string[]; pruned: number }> {
    const { enabled, iterative, minDelta, score, weights } = options;
    if (!enabled || group.length <= 2) return { group, pruned: 0 };
    let g = group.slice(); let pruned = 0; let improved = true; let passes = 0;
    while (improved && passes < 3) {
      improved = false; passes++;
      const base = await score(g, gi); const baseVisual = base.components?.visual ?? 0;
      let bestGain = 0; let bestGroup: string[] | null = null;
      for (const removeId of g) {
        const trial = g.filter(id => id !== removeId); if (trial.length < 2) continue;
        const trialScore = await score(trial, gi); const trialVisual = trialScore.components?.visual ?? 0;
        const gain = trialVisual - baseVisual;
        if (gain > minDelta * (weights?.visual || 15) && gain > bestGain) { bestGain = gain; bestGroup = trial; }
      }
      if (bestGroup) {
        this.logger.debug(`AutoStack: outlier pruning removed asset (pass=${passes}) size=${g.length} -> ${bestGroup.length} visualGain=${bestGain.toFixed(2)}`);
        g = bestGroup; pruned++; improved = iterative && g.length > 2;
      }
      if (!iterative) break;
    }
    return { group: g, pruned };
  }

  /** Reorder group primary by image quality heuristic. */
  private reorderPrimary(group: string[], workingSample: any[], enabled: boolean): string[] {
    if (!enabled || group.length < 2) return group;
    try {
      const details = workingSample.filter((s: any) => group.includes(s.id));
      details.sort((a: any, b: any) => {
        const isoA = a.iso ?? Number.MAX_SAFE_INTEGER; const isoB = b.iso ?? Number.MAX_SAFE_INTEGER; if (isoA !== isoB) return isoA - isoB;
        const expA = a.exposureTime ?? Number.MAX_VALUE; const expB = b.exposureTime ?? Number.MAX_VALUE; if (expA !== expB) return expA - expB;
        const tA = a.dateTimeOriginal ? new Date(a.dateTimeOriginal).getTime() : Number.MAX_SAFE_INTEGER; const tB = b.dateTimeOriginal ? new Date(b.dateTimeOriginal).getTime() : Number.MAX_SAFE_INTEGER; if (tA !== tB) return tA - tB; return a.id.localeCompare(b.id);
      });
      const reordered = details.map((d: any) => d.id); if (reordered[0] !== group[0]) { this.logger.debug(`AutoStack: primary heuristic reordered group primary ${group[0]} -> ${reordered[0]}`); this.telemetryRepository.jobs.addToCounter('immich.auto_stack.primary_reordered_quality', 1); return reordered; }
    } catch {}
    return group;
  }

  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Microservices] })
  onAppBootstrap() {
    this.logger.log('AutoStack: service initialized (listening for AssetMetadataExtracted)');
  }
  // Listen on all workers to avoid missing the event if it's dispatched outside the microservices context
  @OnEvent({ name: 'AssetMetadataExtracted' })
  async onAssetMetadataExtracted({ assetId, userId }: ArgOf<'AssetMetadataExtracted'>) {
    try {
      const { server } = await this.getConfig({ withCache: true });
      if (!server.autoStack.enabled) return;
      // check if the asset already has a stack
      const asset = await this.assetRepository.getById(assetId);
      if (asset && asset.stackId) {
        this.logger.debug(`AutoStack: asset=${assetId} is already in a stack – skip`);
        return;
      }
      this.logger.debug(`AutoStack: metadata extracted asset=${assetId} user=${userId}`);
      const dto = await this.assetRepository.getDateTimeOriginal(assetId);
      if (!dto) {
        this.logger.debug(`AutoStack: asset=${assetId} has no dateTimeOriginal – skip`);
        return;
      }
      const created = await this.generateTimeWindowCandidates(userId, dto, undefined, assetId);
      this.logger.log(`AutoStack: asset=${assetId} generated ${created} visual/time-window candidate group(s)`);
    } catch (error) {
      this.logger.warn(`AutoStackService failed for asset ${assetId}: ${error}`);
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
    if (!server.autoStack.enabled) return 0;
    const {
      windowSeconds,
      maxGapSeconds,
      minGroupSize,
      cameraMatch,
      maxCandidates,
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
      mlOffloadEnabled,
      hysteresisEnabled,
      hysteresisCandidateWindowMinutes,
      hysteresisMaxCandidates,
      hysteresisRaiseScoreBy,
      sessionMaxSpanSeconds,
      sessionMinAvgAdjacency,
      sessionMinSegmentSize
    } = server.autoStack;
    const dynamicAutoPromoteMinScore = await this.applyHysteresis(ownerId, autoPromoteMinScore, {
      enabled: !!hysteresisEnabled,
      candidateWindowMinutes: hysteresisCandidateWindowMinutes,
      maxCandidates: hysteresisMaxCandidates,
      raiseScoreBy: hysteresisRaiseScoreBy,
    });

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
    } catch (e) {
      this.logger.debug(`AutoStack: embedding preload failed: ${e}`);
    }

    // 1. Initial groups
    let groups = this.buildInitialGroups(workingSample, maxGapSeconds, minGroupSize, windowSeconds);
    if (!groups.length) {
      this.logger.debug(`AutoStack: no groups >= minGroupSize=${minGroupSize} (candidates examined=${workingSample.length}) owner=${ownerId}`);
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
    groups = await this.mergeAdjacentGroups(groups, workingSample, embeddingMap, {
      maxGapSeconds,
      maxMergeGapSeconds,
      visualBridgeThreshold,
      mergeScoreDelta,
      windowSeconds,
      weights,
    });
    // 4. Overlap merge if enabled
    if (overlapMergeEnabled) groups = this.mergeOverlapGroups(groups);
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

    let created = 0;
    // Batch ML scoring (default behavior when enabled)
    let batchScores: Record<string, { avgCos: number | null; pHashAvg: number | null; blended: number | null }> | null =
      null;
    if (mlOffloadEnabled && groups.length) {
      try {
        const { machineLearning } = await this.getConfig({ withCache: true });
        const batchPayload = groups.map((g, idx) => {
          const subset = workingSample.filter((s: any) => g.includes(s.id));
          const emb: Record<string, number[]> = {};
          for (const s of subset) {
            if (embeddingMap[s.id]) emb[s.id] = embeddingMap[s.id];
          }
          const pHashes: Record<string, string> = {};
          for (const s of subset) {
            if (s.pHash && /^[0-9a-fA-F]{16}$/.test(s.pHash)) pHashes[s.id] = s.pHash.toLowerCase();
          }
          return { id: String(idx), embeddings: emb, pHashes };
        });
        batchScores = await this.machineLearningRepository.autoStackScoreBatch(machineLearning.urls, batchPayload);
      } catch (e) {
        this.logger.debug(`AutoStack: batch ML scoring failed; will fallback per-group (${e})`);
      }
    }
    const scoreGroup = async (assetIds: string[], groupIndex: number) => {
      const subset = workingSample.filter((s: any) => assetIds.includes(s.id));
      let result: { avgCos: number | null; pHashAvg: number | null; blended: number | null } | null = null;
      if (batchScores && batchScores[String(groupIndex)]) {
        result = batchScores[String(groupIndex)];
      } else if (mlOffloadEnabled) {
        try {
          const emb: Record<string, number[]> = {};
          for (const s of subset) {
            if (embeddingMap[s.id]) emb[s.id] = embeddingMap[s.id];
          }
          const pHashes: Record<string, string> = {};
          for (const s of subset) {
            if (s.pHash && /^[0-9a-fA-F]{16}$/.test(s.pHash)) pHashes[s.id] = s.pHash.toLowerCase();
          }
          const { machineLearning } = await this.getConfig({ withCache: true });
          result = await this.machineLearningRepository.autoStackScore(machineLearning.urls, emb, pHashes);
        } catch (e) {
          this.logger.debug(`AutoStack: per-group ML scoring failed (${e})`);
        }
      }
      const local = computeAutoStackScore({ assets: subset, embeddingMap, weights, maxGapSeconds, windowSeconds });
      if (result && result.blended != null) {
        const visualWeight = weights?.visual ?? 15;
        local.components.visual = Math.round(result.blended * visualWeight);
        if (result.avgCos != null) local.avgCos = result.avgCos;
        local.total = Math.min(
          100,
          Math.round(
            local.components.size +
              local.components.timeSpan +
              local.components.continuity +
              local.components.visual +
              local.components.exposure,
          ),
        );
      }
      return local;
    };

    let prunedTotal = 0;
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
        if (pruned) this.telemetryRepository.jobs.addToCounter('immich.auto_stack.candidates_pruned_outliers', pruned);
        g = prunedGroup;
      } catch (e) {
        this.logger.debug(`AutoStack: outlier pruning error: ${e}`);
      }
      g = this.reorderPrimary(g, workingSample, !!bestPrimaryHeuristic);
      const { total: score, components, avgCos } = await scoreGroup(g, gi);
      this.logger.debug(
        `AutoStack: creating candidate size=${g.length} score=${score} components=${JSON.stringify(components)} owner=${ownerId}`,
      );
      const id = await this.autoStackCandidateRepository.create(ownerId, g, score, components, avgCos);
      if (id && (avgCos === undefined || avgCos === null)) {
        const missing = g.filter((aid) => !embeddingMap[aid]);
        if (missing.length) {
          await this.jobRepository.queueAll(
            missing.map((aid) => ({ name: JobName.SmartSearch as const, data: { id: aid } })),
          );
          await this.jobRepository.queue({ name: JobName.AutoStackCandidateRescore, data: { id } });
        }
      }
      if (id) {
        const pruned = await this.autoStackCandidateRepository.prune(ownerId, maxCandidates);
        prunedTotal += pruned;
        const promoteByVisual =
          visualPromoteThreshold && components.visual / (weights?.visual ?? 15) >= visualPromoteThreshold;
        if ((dynamicAutoPromoteMinScore > 0 && score >= dynamicAutoPromoteMinScore) || promoteByVisual) {
          let stack;
          try {
            stack = await this.stackRepository.create({ ownerId }, g);
            await Promise.all(
              g.map((id: string) =>
                this.assetRepository.upsertExif({ assetId: id, autoStackSource: 'VISUAL' as any }),
              ),
            );
          } catch (e: any) {
            const msg = e?.message || String(e);
            if (msg.includes('duplicate key') && msg.includes('stack_primaryAssetId_uq')) {
              this.logger.debug(
                `AutoStack: auto-promote race detected; stack already exists for primary=${g[0]} owner=${ownerId}`,
              );
              continue;
            }
            throw e;
          }
          await this.autoStackCandidateRepository.promote(id, ownerId, stack.id);
          await this.eventRepository.emit('StackCreate', { stackId: stack.id, userId: ownerId });
          this.telemetryRepository.jobs.addToCounter('immich.auto_stack.candidates_auto_promoted', 1);
          continue; // skip incrementing created (auto-promoted)
        }
        created++;
      }
    }
    if (prunedTotal) {
      this.telemetryRepository.jobs.addToCounter('immich.auto_stack.candidates_pruned', prunedTotal);
    }
    if (created) {
      this.logger.log(`AutoStack: generated ${created} candidate group(s) for owner=${ownerId}`);
      this.telemetryRepository.jobs.addToCounter('immich.auto_stack.candidates_created', created);
    } else {
      this.logger.debug(`AutoStack: all groups already had candidates for owner=${ownerId}`);
    }
    return created;
  }

  @OnJob({ name: JobName.AutoStackCandidateQueueAll, queue: QueueName.BackgroundTask })
  async handleQueueAllCandidates(): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) return JobStatus.Skipped;
    const users = await this.userRepository.getList({ withDeleted: false });
    await this.jobRepository.queueAll(
      users.map((u: any) => ({ name: JobName.AutoStackCandidateGenerate, data: { id: u.id } })),
    );
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AutoStackCandidateGenerate, queue: QueueName.BackgroundTask })
  async handleGenerateCandidates(job: JobOf<JobName.AutoStackCandidateGenerate>): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) return JobStatus.Skipped;
    await this.generateTimeWindowCandidates(job.id, new Date(), server.autoStack.windowSeconds);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AutoStackCandidateBackfill, queue: QueueName.BackgroundTask })
  async handleBackfill(): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) return JobStatus.Skipped;
    const { horizonMinutes } = server.autoStack;
    const users = await this.userRepository.getList({ withDeleted: false });
    const now = Date.now();
    let total = 0;
    for (const u of users) {
      // sample reference points every window across the horizon
      const windowMs = server.autoStack.windowSeconds * 1000;
      for (let t = now - horizonMinutes * 60_000; t <= now; t += windowMs) {
        total += await this.generateTimeWindowCandidates(u.id, new Date(t), server.autoStack.windowSeconds);
      }
    }
    this.logger.log(`AutoStack: backfill processed users=${users.length} created=${total}`);
    return JobStatus.Success;
  }

  async listCandidates(ownerId: string) {
    return this.autoStackCandidateRepository.list(ownerId);
  }

  async getScoreDistribution(ownerId: string) {
    const scores = await this.autoStackCandidateRepository.listScores(ownerId);
    if (!scores.length) return { histogram: [], recommendedAutoPromote: null };
    const bins = Array.from({ length: 11 }, () => 0); // 0-10,11-20,...,100
    for (const s of scores) {
      const idx = Math.min(10, Math.floor(s / 10));
      bins[idx]++;
    }
    // Suggest threshold: smallest score where cumulative above is <= 5 candidates or top 10% whichever lower
    const sorted = [...scores].sort((a, b) => b - a);
    const topK = Math.ceil(sorted.length * 0.1);
    const cap = Math.min(5, topK);
    const slice = sorted.slice(0, cap);
    const recommended = slice.length ? Math.min(95, Math.max(50, Math.floor(slice[slice.length - 1] / 5) * 5)) : null;
    return {
      histogram: bins.map((count, i) => ({ range: `${i * 10}-${i === 10 ? 100 : i * 10 + 9}`, count })),
      recommendedAutoPromote: recommended,
    };
  }

  // Queue-all job to generate candidates for recent assets per user (prototype scope: last 5 minutes window centered at now)
  // Placeholder: no queue-all job yet; will add dedicated JobName in later phase.

  @OnJob({ name: JobName.AutoStackEnqueueMissingEmbeddings, queue: QueueName.BackgroundTask })
  async handleEnqueueMissingEmbeddings(job: JobOf<JobName.AutoStackEnqueueMissingEmbeddings>): Promise<JobStatus> {
    const { server, machineLearning } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) return JobStatus.Skipped;
    // For each asset in candidate, if no embedding, enqueue SmartSearch job
    const assetIds = await this.autoStackCandidateRepository.getCandidateAssetIds(job.id);
    if (!assetIds.length) return JobStatus.Skipped;
    const embeddingMap = await this.assetRepository.getClipEmbeddings(assetIds);
    const missing = assetIds.filter((id) => !embeddingMap[id]);
    if (!missing.length) return JobStatus.Success;
    await this.jobRepository.queueAll(missing.map((id) => ({ name: JobName.SmartSearch as const, data: { id } })));
    // After embeddings are generated, a separate trigger should queue a rescore. For now we optimistically queue rescore.
    await this.jobRepository.queue({ name: JobName.AutoStackCandidateRescore, data: { id: job.id } });
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AutoStackCandidateRescore, queue: QueueName.BackgroundTask })
  async handleRescore(job: JobOf<JobName.AutoStackCandidateRescore>): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) return JobStatus.Skipped;
    const candidateId = job.id;
    const assetIds = await this.autoStackCandidateRepository.getCandidateAssetIds(candidateId);
    if (assetIds.length < 2) return JobStatus.Skipped;
    const workingSample = await this.assetRepository.getAssetsScoringInfo(assetIds);
    const embeddingMap = await this.assetRepository.getClipEmbeddings(assetIds);
    const {
      maxGapSeconds,
      windowSeconds,
      weights,
      autoPromoteMinScore: apMinScore,
      visualPromoteThreshold: visPromote,
    } = server.autoStack;
    const { total, components, avgCos } = computeAutoStackScore({
      assets: workingSample,
      embeddingMap,
      weights,
      maxGapSeconds,
      windowSeconds,
    });
    await this.autoStackCandidateRepository.updateScore(candidateId, total, components, avgCos);
    this.telemetryRepository.jobs.addToCounter('immich.auto_stack.candidates_rescored', 1);
    // Auto promote if thresholds now satisfied
    const { autoPromoteMinScore: apMinScore2, visualPromoteThreshold: visPromote2 } = server.autoStack;
    const ownerId = await this.autoStackCandidateRepository.getCandidateOwner(candidateId);
    const promoteByVisual = visPromote2 && components.visual / (weights?.visual ?? 15) >= visPromote2;
    if (ownerId && ((apMinScore2 > 0 && total >= apMinScore2) || promoteByVisual)) {
      const stack = await this.stackRepository.create({ ownerId }, assetIds);
      await this.autoStackCandidateRepository.promote(candidateId, ownerId, stack.id);
      await this.eventRepository.emit('StackCreate', { stackId: stack.id, userId: ownerId });
      this.telemetryRepository.jobs.addToCounter('immich.auto_stack.candidates_auto_promoted', 1);
    }
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AutoStackPHashBackfill, queue: QueueName.BackgroundTask })
  async handlePHashBackfill(): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled || !server.autoStack.pHashBackfillEnabled) return JobStatus.Skipped;
    // Batch process assets missing pHash
    const batchSize = server.autoStack.pHashBackfillBatchSize || 500;
    // Simple query via repository (reuse existing method getAssetsScoringInfo not ideal). Direct SQL for efficiency.
    try {
      const rows: any[] = await (this.assetRepository as any).db
        .selectFrom('asset')
        .leftJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .select(['asset.id', 'asset.originalPath'])
        .where('asset_exif.pHash', 'is', null)
        .where('asset.deletedAt', 'is', null)
        .limit(batchSize)
        .execute();
      if (!rows.length) return JobStatus.Success;
      for (const row of rows) {
        try {
          const ph = await this.machineLearningRepository.computePhash(
            (await this.getConfig({ withCache: true })).machineLearning.urls,
            row.originalPath,
          );
          if (ph) {
            await this.assetRepository.upsertExif({ assetId: row.id, pHash: ph } as any);
          }
        } catch {}
      }
      return JobStatus.Success;
    } catch (e) {
      this.logger.warn(`AutoStack: pHash backfill failed: ${e}`);
      return JobStatus.Failed;
    }
  }

  @OnJob({ name: JobName.AutoStackCandidateAging, queue: QueueName.BackgroundTask })
  async handleCandidateAging(): Promise<JobStatus> {
    const { server } = await this.getConfig({ withCache: true });
    if (!server.autoStack.enabled) return JobStatus.Skipped;
    const { candidateAgingDays, candidateAgingScoreThreshold } = server.autoStack as any;
    if (!candidateAgingDays) return JobStatus.Skipped;
    const cutoff = new Date(Date.now() - candidateAgingDays * 24 * 60 * 60 * 1000);
    try {
      const db: any = (this.autoStackCandidateRepository as any).db;
      const stale: any[] = await db
        .selectFrom('auto_stack_candidate')
        .select(['id'])
        .where('createdAt', '<', cutoff)
        .where('dismissedAt', 'is', null)
        .where('promotedStackId', 'is', null)
        .$if(!!candidateAgingScoreThreshold, (qb: any) => qb.where('score', '<', candidateAgingScoreThreshold))
        .execute();
      if (!stale.length) return JobStatus.Success;
      const ids = stale.map((s) => s.id);
      await db.updateTable('auto_stack_candidate').set({ dismissedAt: new Date() }).where('id', 'in', ids).execute();
      this.telemetryRepository.jobs.addToCounter('immich.auto_stack.candidates_dismissed', ids.length);
      return JobStatus.Success;
    } catch (e) {
      this.logger.warn(`AutoStack: candidate aging failed: ${e}`);
      return JobStatus.Failed;
    }
  }

}
